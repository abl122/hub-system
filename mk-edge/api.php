<?php
/**
 * MK-EDGE AGENT API - Versão 2.0
 * 
 * Agente local instalado no servidor MK-Auth que executa queries
 * de forma segura com múltiplas camadas de proteção.
 * 
 * @version 2.0
 * @author MK-Edge Tecnologia Ltda
 * @date 2026-01-08
 */

// Configuração inicial
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
set_time_limit(30);

// Aumenta limites para queries grandes
ini_set('memory_limit', '256M');
ini_set('output_buffering', '0'); // Desabilita buffering completamente

// NÃO usa ob_start() quando output_buffering está desabilitado

// Handler global de erros
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    // Ignora warnings e notices durante operação normal
    if ($errno === E_WARNING || $errno === E_NOTICE) {
        return false; // Deixa PHP lidar com isso
    }
    
    while (ob_get_level()) ob_end_clean();
    
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    
    echo json_encode([
        'success' => false,
        'error' => 'Erro interno do servidor',
        'debug' => defined('DEBUG') && DEBUG ? [
            'message' => $errstr,
            'file' => basename($errfile),
            'line' => $errline
        ] : null
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

// Handler de exceções
set_exception_handler(function($exception) {
    while (ob_get_level()) ob_end_clean();
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Exceção não tratada',
        'debug' => defined('DEBUG') && DEBUG ? [
            'message' => $exception->getMessage(),
            'file' => basename($exception->getFile()),
            'line' => $exception->getLine()
        ] : null
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

// Handler de shutdown - NÃO interfere com respostas normais
register_shutdown_function(function() {
    $error = error_get_last();
    
    // Apenas trata erros fatais REAIS
    if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
        // Só envia erro se headers ainda não foram enviados
        if (!headers_sent()) {
            while (ob_get_level()) ob_end_clean();
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'success' => false,
                'error' => 'Erro fatal do servidor',
                'debug' => defined('DEBUG') && DEBUG ? $error : null
            ], JSON_UNESCAPED_UNICODE);
        }
    }
    // NÃO faz flush automático - deixa mkedge_json() lidar com isso
});

////////////////////////////
// CARREGA CONFIGURAÇÕES
////////////////////////////

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Config file not found']));
}
require_once $configFile;

// Validação de configurações obrigatórias
if (!defined('MKEDGE_API_TOKEN') || !defined('DB_HOST') || !defined('DB_NAME')) {
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Invalid configuration']));
}

// ============================================
// ENCRIPTAÇÃO AES-256
// ============================================

const ENCRYPTION_KEY = '';

/**
 * Descriptografa query AES-256-CBC
 * Compatível com Node.js crypto
 * 
 * @param string $encrypted_data Formato: "IV_HEX:ENCRYPTED_HEX"
 * @param string $key Chave de encriptação (será hasheada com SHA-256)
 * @return string|false SQL descriptografado ou false se falhar
 */
function mkedge_decrypt_query($encrypted_data, $key) {
    if (empty($key)) {
        return false; // Sem chave, não consegue descriptografar
    }
    
    try {
        // Separa IV e dados encriptados
        $parts = explode(':', $encrypted_data, 2);
        if (count($parts) !== 2) {
            return false;
        }
        
        list($iv_hex, $encrypted_hex) = $parts;
        
        // Converte hex para binário
        $iv = @hex2bin($iv_hex);
        $encrypted = @hex2bin($encrypted_hex);
        
        if ($iv === false || $encrypted === false) {
            return false;
        }
        
        // Deriva a chave com SHA-256 (igual ao Node.js)
        $key_derived = hash('sha256', $key, true);
        
        // Descriptografa com AES-256-CBC
        $decrypted = openssl_decrypt(
            $encrypted,
            'aes-256-cbc',
            $key_derived,
            false, // Não retorna binário puro
            $iv
        );
        
        if ($decrypted === false) {
            mkedge_log('ERROR', 'openssl_decrypt falhou', [
                'error' => openssl_error_string()
            ]);
            return false;
        }
        
        return $decrypted;
        
    } catch (Exception $e) {
        mkedge_log('ERROR', 'Erro ao descriptografar', [
            'error' => $e->getMessage()
        ]);
        return false;
    }
}

////////////////////////////
// FUNÇÕES AUXILIARES
////////////////////////////

/**
 * Retorna resposta JSON e encerra
 */
function mkedge_json($data, int $code = 200): void
{
    // Limpa buffers apenas se existirem
    while (ob_get_level()) ob_end_clean();
    
    // Define headers ANTES de qualquer output
    if (!headers_sent()) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Encoding: none'); // Evita compressão automática
        header('X-Accel-Buffering: no'); // Nginx: desabilita buffering
    }
    
    // Codifica resposta
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    // Verifica se json_encode falhou
    if ($json === false) {
        $error = json_last_error_msg();
        mkedge_log('ERROR', 'Falha ao codificar JSON', [
            'error' => $error,
            'data_size' => strlen(serialize($data))
        ]);
        
        http_response_code(500);
        $json = json_encode([
            'success' => false,
            'error' => 'Falha ao codificar resposta: ' . $error
        ], JSON_UNESCAPED_UNICODE);
    }
    
    // Envia resposta diretamente
    echo $json;
    
    // Força envio imediato (FastCGI ou flush normal)
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } else {
        if (ob_get_level() === 0) {
            flush();
        }
    }
    
    // Encerra IMEDIATAMENTE sem executar shutdown handlers
    exit(0);
}

/**
 * Lê input JSON
 */
function mkedge_input(): array
{
    $raw = file_get_contents('php://input');
    
    if (strlen($raw) > 50000) {
        mkedge_json(['success' => false, 'error' => 'Payload muito grande'], 413);
    }
    
    // Decodifica JSON preservando objetos vazios
    $json = json_decode($raw, true, 512, JSON_OBJECT_AS_ARRAY);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        mkedge_json(['success' => false, 'error' => 'JSON inválido: ' . json_last_error_msg()], 400);
    }
    
    // Converte objetos vazios {} para [] para consistência
    // mas mantém para validação de assinatura
    return is_array($json) ? $json : [];
}

/**
 * Obtém IP real do cliente
 */
function mkedge_client_ip(): string
{
    $trusted_proxies = ['127.0.0.1', '::1', 'localhost'];
    $remote = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    
    if (in_array($remote, $trusted_proxies) && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $forwarded = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($forwarded[0]);
    }
    
    return $remote;
}

/**
 * Registra apenas eventos críticos (ERROR/CRITICAL)
 * Ignora logs informativos (INFO, WARN) para performance
 */
function mkedge_log(string $level, string $message, array $context = []): void
{
    if (!defined('LOG_FILE') || !LOG_FILE) {
        return;
    }
    
    // Apenas loga ERROR e CRITICAL para reduzir verbosidade
    if (!in_array($level, ['ERROR', 'CRITICAL'], true)) {
        return;
    }
    
    $log = [
        'timestamp' => date('Y-m-d H:i:s'),
        'level'     => $level,
        'message'   => $message,
        'ip'        => mkedge_client_ip(),
        'context'   => $context,
    ];
    
    $logDir = dirname(LOG_FILE);
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0750, true);
    }
    
    @file_put_contents(LOG_FILE, json_encode($log, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
}

/**
 * Rate Limiting
 */
function mkedge_rate_limit(string $ip): void
{
    if (!defined('RATE_LIMIT_ENABLED') || !RATE_LIMIT_ENABLED) {
        return;
    }
    
    $cacheDir = sys_get_temp_dir() . '/mkedge_rl';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0750, true);
    }
    
    $file = $cacheDir . '/' . md5($ip);
    $now = time();
    $window = 900; // 15 minutos
    $maxAttempts = 100; // 100 requisições por 15 min
    
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true);
        $attempts = $data['attempts'] ?? 0;
        $firstAttempt = $data['first'] ?? $now;
        
        if ($now - $firstAttempt > $window) {
            $attempts = 1;
            $firstAttempt = $now;
        } else {
            $attempts++;
        }
        
        if ($attempts > $maxAttempts) {
            $timeLeft = ceil(($firstAttempt + $window - $now) / 60);
            mkedge_json([
                'success' => false,
                'error' => "Muitas requisições. Aguarde {$timeLeft} minutos."
            ], 429);
        }
    } else {
        $attempts = 1;
        $firstAttempt = $now;
    }
    
    file_put_contents($file, json_encode([
        'attempts' => $attempts,
        'first' => $firstAttempt,
    ]));
}

/**
 * Força HTTPS
 */
function mkedge_enforce_https(): void
{
    if (!defined('REQUIRE_HTTPS') || !REQUIRE_HTTPS) {
        return;
    }
    
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
               (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
               (!empty($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
    
    if (!$isHttps) {
        mkedge_json(['success' => false, 'error' => 'HTTPS obrigatório'], 403);
    }
}

/**
 * Valida assinatura HMAC
 */
function mkedge_verify_signature(array $input): void
{
    $signature = $input['signature'] ?? null;
    $timestamp = $input['timestamp'] ?? null;
    
    if (!$signature || !$timestamp) {
        mkedge_json(['success' => false, 'error' => 'Assinatura inválida'], 401);
    }
    
    // Valida timestamp (janela de 5 minutos)
    $now = time();
    $timestampSeconds = floor($timestamp / 1000);
    
    if (abs($now - $timestampSeconds) > 300) {
        mkedge_json(['success' => false, 'error' => 'Requisição expirada'], 401);
    }
    
    // Função para converter arrays vazios em objetos stdClass para JSON consistente
    $normalizeForJson = function($data) use (&$normalizeForJson) {
        if (is_array($data)) {
            // Se array vazio, converte para objeto vazio para match com Node.js {}
            if (empty($data)) {
                return new stdClass();
            }
            
            // Se array associativo, processa recursivamente
            $result = [];
            foreach ($data as $key => $value) {
                $result[$key] = $normalizeForJson($value);
            }
            return $result;
        }
        return $data;
    };
    
    // Ordena recursivamente todos os níveis do array
    $deepSort = function($data) use (&$deepSort) {
        if (is_array($data)) {
            ksort($data);
            foreach ($data as $key => $value) {
                $data[$key] = $deepSort($value);
            }
        }
        return $data;
    };
    
    // Calcula assinatura esperada
    $dataToSign = $input;
    unset($dataToSign['signature']);
    $dataToSign = $deepSort($dataToSign);
    $dataToSign = $normalizeForJson($dataToSign);
    
    $jsonData = json_encode($dataToSign, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $expected = hash_hmac('sha256', $jsonData, MKEDGE_API_TOKEN);
    
    if (!hash_equals($expected, $signature)) {
        mkedge_log('CRITICAL', 'Assinatura HMAC inválida', [
            'received' => substr($signature, 0, 20),
            'expected' => substr($expected, 0, 20),
            'json_data' => defined('DEBUG') && DEBUG ? $jsonData : substr($jsonData, 0, 100)
        ]);
        mkedge_json(['success' => false, 'error' => 'Assinatura inválida'], 401);
    }
}

/**
 * Autenticação: IP + HMAC
 */
function mkedge_auth(array $input): void
{
    // IP Whitelist
    $ip = mkedge_client_ip();
    $allowedIps = defined('ALLOWED_IPS') ? explode(',', ALLOWED_IPS) : [];
    $allowedIps = array_map('trim', $allowedIps);
    
    if (!in_array($ip, $allowedIps, true) && !in_array('*', $allowedIps, true)) {
        mkedge_log('CRITICAL', 'IP não autorizado', ['ip' => $ip]);
        mkedge_json(['success' => false, 'error' => 'IP não autorizado'], 403);
    }
    
    // HMAC Signature
    mkedge_verify_signature($input);
}

/**
 * Valida se a query é segura
 */
function mkedge_validate_query(string $sql): array
{
    $sql_upper = strtoupper(trim($sql));
    
    // Operações proibidas
    $forbidden = [
        'DROP', 'TRUNCATE', 'ALTER TABLE', 'CREATE TABLE', 'CREATE DATABASE',
        'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL',
        'LOAD_FILE', 'OUTFILE', 'DUMPFILE', 'INTO OUTFILE',
        'INFORMATION_SCHEMA', 'SHOW TABLES', 'SHOW DATABASES',
        'BENCHMARK', 'SLEEP', 'WAITFOR'
    ];
    
    foreach ($forbidden as $cmd) {
        if (strpos($sql_upper, $cmd) !== false) {
            return ['valid' => false, 'reason' => "Comando proibido: $cmd"];
        }
    }
    
    // Apenas SELECT, INSERT, UPDATE, DELETE
    if (!preg_match('/^\s*(SELECT|INSERT|UPDATE|DELETE)\s+/i', $sql)) {
        return ['valid' => false, 'reason' => 'Apenas SELECT, INSERT, UPDATE e DELETE são permitidos'];
    }
    
    // Proteção contra SQL Injection
    if (preg_match('/;\s*(DROP|DELETE|TRUNCATE|ALTER|CREATE|GRANT)/i', $sql)) {
        return ['valid' => false, 'reason' => 'Múltiplas queries ou comandos maliciosos detectados'];
    }
    
    // Detecta comentários SQL
    if (preg_match('/--[^\n]*[\n\r]|#[^\n]*[\n\r]|\/\*[\s\S]*?\*\//i', $sql)) {
        return ['valid' => false, 'reason' => 'Comentários SQL não são permitidos'];
    }
    
    // Whitelist de tabelas
    $allowedTables = defined('ALLOWED_TABLES') 
        ? explode(',', ALLOWED_TABLES)
        : ['*'];
    
    $allowedTables = array_map('trim', $allowedTables);
    
    if (!in_array('*', $allowedTables)) {
        preg_match_all('/(?:FROM|JOIN|UPDATE|INTO|DELETE\s+FROM)\s+`?(\w+)`?/i', $sql, $matches);
        $tables = $matches[1] ?? [];
        
        foreach ($tables as $table) {
            if (!in_array($table, $allowedTables)) {
                return ['valid' => false, 'reason' => "Tabela não permitida: $table"];
            }
        }
    }
    
    return ['valid' => true];
}

/**
 * Conecta ao banco de dados
 */
function mkedge_db(): PDO
{
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5,
            ]
        );
        
        // Força UTF-8 na conexão MySQL
        $pdo->exec("SET NAMES utf8mb4");
        $pdo->exec("SET CHARACTER SET utf8mb4");
        
        return $pdo;
    } catch (PDOException $e) {
        mkedge_log('ERROR', 'Falha ao conectar ao banco', ['error' => $e->getMessage()]);
        mkedge_json(['success' => false, 'error' => 'Erro ao conectar ao banco de dados'], 500);
    }
}

/**
 * Executa uma query preparada
 */
function mkedge_execute_query(PDO $pdo, array $input): void
{
    $sql = trim($input['sql'] ?? '');
    $params = $input['params'] ?? [];
    
    if (empty($sql)) {
        mkedge_json(['success' => false, 'error' => 'SQL vazio'], 400);
    }
    
    // ============================================
    // DESCRIPTOGRAFA SE NECESSÁRIO
    // ============================================
    
    if (!empty($input['encrypted'])) {
        // Obtém chave de encriptação (variável de ambiente ou config)
        $encryptionKey = getenv('AGENT_ENCRYPTION_KEY');
        if (!$encryptionKey && defined('AGENT_ENCRYPTION_KEY')) {
            $encryptionKey = AGENT_ENCRYPTION_KEY;
        }
        
        if (empty($encryptionKey)) {
            mkedge_log('ERROR', 'Chave de encriptação não configurada');
            mkedge_json([
                'success' => false,
                'error' => 'Agente não configurado para descriptografar queries encriptadas'
            ], 400);
        }
        
        // Descriptografa
        $decrypted_sql = mkedge_decrypt_query($sql, $encryptionKey);
        
        if ($decrypted_sql === false) {
            mkedge_log('CRITICAL', 'Falha ao descriptografar query');
            mkedge_json([
                'success' => false,
                'error' => 'Falha ao descriptografar query'
            ], 400);
        }
        
        $sql = $decrypted_sql;
    }
    
    // Valida query
    $validation = mkedge_validate_query($sql);
    if (!$validation['valid']) {
        mkedge_json([
            'success' => false,
            'error' => 'Query não permitida',
            'reason' => $validation['reason']
        ], 403);
    }
    
    // Valida parâmetros
    if (!is_array($params)) {
        $params = [];
    }
    
    foreach ($params as $key => $value) {
        if (is_string($value) && strlen($value) > 10000) {
            mkedge_json(['success' => false, 'error' => "Parâmetro muito longo: $key"], 400);
        }
    }
    
    try {
        $startTime = microtime(true);
        
        $stmt = $pdo->prepare($sql);
        
        // Execute com parâmetros posicionais (?) ou nomeados (:nome)
        $stmt->execute($params);
        
        // Determina tipo de operação
        $operation = 'SELECT';
        if (preg_match('/^\s*(INSERT|UPDATE|DELETE)\s+/i', $sql, $matches)) {
            $operation = strtoupper($matches[1]);
        }
        
        // Resultado baseado no tipo
        if ($operation === 'SELECT') {
            $data = $stmt->fetchAll();
            $rowCount = count($data);
            
            // Fix UTF-8 encoding issues - detecta e converte charset automaticamente
            array_walk_recursive($data, function(&$value) {
                if (is_string($value)) {
                    // Detecta encoding real e converte para UTF-8
                    $detected = mb_detect_encoding($value, ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'ASCII'], true);
                    if ($detected && $detected !== 'UTF-8') {
                        $value = mb_convert_encoding($value, 'UTF-8', $detected);
                    } elseif (!mb_check_encoding($value, 'UTF-8')) {
                        // Se não detectou mas não é UTF-8 válido, assume latin1
                        $value = mb_convert_encoding($value, 'UTF-8', 'ISO-8859-1');
                    }
                }
            });
        } else {
            $data = [];
            $rowCount = $stmt->rowCount();
        }
        
        $executionTime = round((microtime(true) - $startTime) * 1000, 2);
        
        $response = [
            'success' => true,
            'operation' => $operation,
            'execution_time_ms' => $executionTime
        ];
        
        if ($operation === 'SELECT') {
            $response['data'] = $data;
            $response['count'] = $rowCount;
        } else {
            $response['affected_rows'] = $rowCount;
            
            if ($operation === 'INSERT') {
                $lastId = $pdo->lastInsertId();
                if ($lastId) {
                    $response['insert_id'] = (int)$lastId;
                }
            }
        }
        
        // Não loga queries bem-sucedidas para reduzir verbosidade
        // Apenas erros são capturados e logados em mkedge_log()
        
        mkedge_json($response);
        
    } catch (PDOException $e) {
        // Extrai informações detalhadas do erro
        $errorInfo = $e->errorInfo ?? [null, null, null];
        $sqlState = $errorInfo[0] ?? $e->getCode();
        $errorMessage = $errorInfo[2] ?? $e->getMessage();
        
        // Detecta tipo de erro e oferece sugestão
        $suggestion = '';
        if (preg_match('/Unknown column/i', $errorMessage)) {
            $suggestion = 'Verifique os nomes das colunas na sua query. Uma coluna mencionada não existe na tabela.';
        } elseif (preg_match('/Duplicate entry/i', $errorMessage)) {
            $suggestion = 'Chave única (UNIQUE) duplicada. O valor já existe na tabela.';
        } elseif (preg_match('/foreign key constraint/i', $errorMessage)) {
            $suggestion = 'Violação de chave estrangeira. Verifique se o ID referenciado existe na tabela relacionada.';
        } elseif (preg_match('/Syntax error/i', $errorMessage)) {
            $suggestion = 'Erro de sintaxe SQL. Revise a estrutura da query.';
        } elseif (preg_match('/Incorrect number of parameters/i', $errorMessage)) {
            $suggestion = 'Número de placeholders (?) não corresponde ao número de parâmetros.';
        } elseif (preg_match('/Invalid parameter number/i', $errorMessage)) {
            $suggestion = 'Os parâmetros não estão sendo vinculados corretamente. Verifique a correspondência entre placeholders e parâmetros.';
        }
        
        // Log minimalista para diagnóstico de erros
        $errorContext = [
            'sqlstate' => $sqlState,
            'error_code' => $errorInfo[1] ?? $e->getCode(),
            'error_message' => substr($errorMessage, 0, 200), // Trunca mensagem
            'suggestion' => substr($suggestion, 0, 200),
        ];
        
        mkedge_log('ERROR', 'Erro ao executar query', $errorContext);
        
        // Retorna resposta com detalhes para o backend debugar
        mkedge_json([
            'success' => false,
            'error' => 'Erro ao executar query',
            'details' => [
                'sqlstate' => $sqlState,
                'error_code' => $errorInfo[1] ?? $e->getCode(),
                'message' => $errorMessage,
                'suggestion' => $suggestion,
                'sql' => substr($sql, 0, 300),
                'param_count' => count($params),
                'params' => array_map(function($v) {
                    if (is_string($v) && strlen($v) > 100) {
                        return substr($v, 0, 100) . '...';
                    }
                    return $v;
                }, $params),
            ]
        ], 400);
    }
}

////////////////////////////
// FLUXO PRINCIPAL
////////////////////////////

// Define headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS para desenvolvimento
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Responde OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    mkedge_json(['success' => true, 'message' => 'CORS OK']);
}

// Força HTTPS se configurado
mkedge_enforce_https();

// Apenas POST permitido
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    mkedge_json(['success' => false, 'error' => 'Método não permitido'], 405);
}

// Lê input
$input = mkedge_input();

// Rate limiting
$clientIp = mkedge_client_ip();
mkedge_rate_limit($clientIp);

// Autenticação
mkedge_auth($input);

// Processa ação
try {
    $action = $input['action'] ?? 'ping';

    switch ($action) {
        case 'ping':
            mkedge_json([
                'success' => true,
                'status' => 'ok',
                'version' => '2.1.0',
                'timestamp' => time(),
                'server_time' => date('Y-m-d H:i:s')
            ]);
            break;
            
        case 'execute_query':
            $pdo = mkedge_db();
            mkedge_execute_query($pdo, $input);
            break;
            
        default:
            mkedge_json(['success' => false, 'error' => 'Ação inválida'], 400);
    }
} catch (Exception $e) {
    mkedge_log('ERROR', 'Exceção no fluxo principal', [
        'error' => $e->getMessage()
    ]);
    
    mkedge_json([
        'success' => false,
        'error' => 'Erro ao processar requisição',
        'debug' => defined('DEBUG') && DEBUG ? $e->getMessage() : null
    ], 500);
}
