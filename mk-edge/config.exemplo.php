<?php
/**
 * CONFIGURAÇÃO DO AGENTE MK-EDGE
 * 
 * IMPORTANTE:
 * 1. Ajuste as configurações conforme seu ambiente
 * 2. NÃO versione este arquivo (adicione ao .gitignore)
 * 3. Mantenha o token secreto seguro
 * 
 * @version 2.1.0
 * @date 2026-01-08
 */

////////////////////////////
// AUTENTICAÇÃO
////////////////////////////

/**
 * Token secreto compartilhado com o backend MK-Edge
 * CRÍTICO: Use um token único e forte
 * Comando: openssl rand -hex 32
 */
define('MKEDGE_API_TOKEN', '34231c4733cb2c3d123456e5a1778835d7c30e3a88f1812528bedb353197br16');

/**
 * IPs autorizados (separados por vírgula)
 * Use '*' apenas para desenvolvimento
 * Produção: IP público do servidor MK-Edge
 */
define('ALLOWED_IPS', '*');

////////////////////////////
// BANCO DE DADOS
////////////////////////////

/**
 * Host do MySQL
 */
define('DB_HOST', '127.0.0.1');

/**
 * Nome do banco de dados do MK-Auth
 */
define('DB_NAME', 'mkradius');

/**
 * Usuário do banco
 * RECOMENDAÇÃO: Crie usuário com permissões limitadas
 */
define('DB_USER', 'root');

/**
 * Senha do banco
 */
define('DB_PASS', 'vertrigo');

/**
 * Charset do banco
 * mkradius geralmente usa latin1
 */
define('DB_CHARSET', 'latin1');

////////////////////////////
// SEGURANÇA
////////////////////////////

/**
 * Forçar HTTPS
 * true = apenas HTTPS (recomendado em produção)
 * false = aceita HTTP (desenvolvimento)
 */
define('REQUIRE_HTTPS', false);

/**
 * Habilitar rate limiting
 * true = limita requisições por IP
 * false = sem limite
 */
define('RATE_LIMIT_ENABLED', false);

/**
 * Modo debug
 * true = mostra erros detalhados (APENAS DESENVOLVIMENTO)
 * false = oculta detalhes (produção)
 */
define('DEBUG', true);

/**
 * Tabelas permitidas (separadas por vírgula)
 * Use '*' para permitir todas (não recomendado)
 */
define('ALLOWED_TABLES', 'sis_cliente,sis_cliente_contrato,sis_cliente_endereco,radcheck,radacct,radreply,radgroupreply,radgroupcheck,radusergroup,radpostauth,titulo,sis_lanc,sis_boleto,sis_qrpix,sis_suporte,sis_solic,sis_plano,sis_func,sis_msg,sis_opcao,sis_provedor,sis_acesso,sis_logs,sis_perm,mp_caixa,olt,pon,vtab_conectados,edge_notifications,connected_users');

/**
 * Limite máximo de resultados por query
 */
define('MAX_QUERY_RESULTS', 1000);

/**
 * Arquivo de log (deixe vazio para desabilitar)
 */
define('LOG_FILE', __DIR__ . '/logs/agent.log');

/**
 * Email para alertas críticos (opcional)
 */
// define('ALERT_EMAIL', 'admin@exemplo.com');
