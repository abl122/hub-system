<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const copied = ref(false)
const addonToken = ref('')
const appToken = ref('')

// Gera conteúdo do config.php com token do cliente
const configPhpContent = computed(() => {
  return `<?php
/**
 * CONFIGURAÇÃO DO AGENTE MK-EDGE
 * Cliente: ${authStore.portalUser?.name || 'Cliente'}
 * Gerado em: ${new Date().toLocaleString('pt-BR')}
 */

define('MKEDGE_API_TOKEN', '${addonToken.value}');
define('ALLOWED_IPS', '*');
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'mkradius');
define('DB_USER', 'root');
define('DB_PASS', 'vertrigo');  // ALTERE PARA SUA SENHA
define('DB_CHARSET', 'latin1');
define('REQUIRE_HTTPS', false);
define('RATE_LIMIT_ENABLED', false);
define('DEBUG', true);
define('ALLOWED_TABLES', 'sis_cliente,sis_cliente_contrato,radcheck,radacct,radreply,titulo,sis_lanc');
define('MAX_QUERY_RESULTS', 1000);
define('LOG_FILE', __DIR__ . '/logs/agent.log');
`
})

const copyInstallCommand = async () => {
  try {
    const command = `curl -s https://mk-edge.com.br/install | bash -s ${appToken.value}`
    await navigator.clipboard.writeText(command)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Erro ao copiar:', err)
  }
}

onMounted(() => {
  // Tentar buscar do authStore primeiro
  const tenantId = authStore.portalUser?.id || localStorage.getItem('tenantId') || ''
  const agentToken = localStorage.getItem('agentToken') || ''
  
  addonToken.value = agentToken
  appToken.value = tenantId
  
  // Log para debug
  console.log('PortalInstall carregado:')
  console.log('  - addonToken:', addonToken.value ? addonToken.value.substring(0, 10) + '...' : 'VAZIO')
  console.log('  - appToken:', appToken.value)
  console.log('  - localStorage agentToken:', localStorage.getItem('agentToken') ? 'EXISTS' : 'MISSING')
  console.log('  - localStorage tenantId:', localStorage.getItem('tenantId') ? 'EXISTS' : 'MISSING')
})
</script>

<template>
  <div class="install-page">
    <div class="page-header">
      <h1>Instalar Addon MK-Edge</h1>
    </div>

    <div class="install-content">
      
      <!-- Configuração -->
      <div class="config-section">
        <h2>Configuração</h2>
        
        <div class="config-grid">
          <div class="config-item">
            <label>Token do Addon MK-Edge</label>
            <code>{{ addonToken }}</code>
          </div>
          
          <div class="config-item">
            <label>Token do App MK-Edge</label>
            <code>{{ appToken }}</code>
          </div>
        </div>

        <div class="install-instructions">
          <h3>Instruções de Instalação</h3>
          
          <div class="install-step">
            <span class="step-number">1</span>
            <div class="step-content">
              <p>Execute o comando no servidor MkAuth:</p>
              <div class="command-box">
                <code>curl -s https://mk-edge.com.br/install | bash -s {{ appToken }}</code>
                <button @click="copyInstallCommand" class="btn-copy-inline" :class="{ 'copied': copied }">
                  {{ copied ? '✓' : '📋' }}
                </button>
              </div>
            </div>
          </div>

          <div class="install-step">
            <span class="step-number">2</span>
            <div class="step-content">
              <p>Configure a senha do MySQL em <code>/opt/mk-auth/admin/addons/mk-edge/config.php</code></p>
            </div>
          </div>

          <div class="install-step">
            <span class="step-number">3</span>
            <div class="step-content">
              <p>Pronto! O addon está instalado e funcionando.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.install-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #1f2937;
  margin: 0;
  font-weight: 700;
}

.install-content {
  display: flex;
  flex-direction: column;
}

/* Configuração */
.config-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.config-section h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.config-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.config-item label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.config-item code {
  display: block;
  background: #f3f4f6;
  color: #1f2937;
  padding: 1rem;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  word-break: break-all;
  border: 1px solid #e5e7eb;
}

/* Instruções */
.install-instructions h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.install-step {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

.step-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.step-content {
  flex: 1;
}

.step-content p {
  margin: 0 0 0.75rem 0;
  color: #4b5563;
  line-height: 1.6;
}

.step-content code {
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #1f2937;
}

.command-box {
  position: relative;
  background: #1f2937;
  padding: 1rem 3rem 1rem 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.command-box code {
  display: block;
  color: #10b981;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  word-break: break-all;
  background: transparent;
  padding: 0;
  border: none;
}

.btn-copy-inline {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: #374151;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.btn-copy-inline:hover {
  background: #4b5563;
}

.btn-copy-inline.copied {
  background: #10b981;
}

/* Responsivo */
@media (max-width: 768px) {
  .install-page {
    padding: 1rem;
  }

  .config-section {
    padding: 1.5rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .command-box {
    padding-right: 2.5rem;
  }

  .command-box code {
    font-size: 0.75rem;
  }
}
</style>
