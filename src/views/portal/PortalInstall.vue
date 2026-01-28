<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { tenantsService } from '@/services/tenantsService'

const authStore = useAuthStore()
const copied = ref(false)
const addonToken = ref('')
const appToken = ref('')
const agentUrl = ref('')
const loading = ref(false)

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

const reloadTenantData = async () => {
  loading.value = true
  
  try {
    const tenantId = authStore.portalUser?.id || localStorage.getItem('tenantId') || ''
    const token = authStore.portalToken || localStorage.getItem('portalToken') || ''
    
    if (tenantId && token) {
      const response = await tenantsService.getTenant(tenantId, token)
      
      if (response.success && response.tenant) {
        if (response.tenant.agente?.token) {
          localStorage.setItem('agentToken', response.tenant.agente.token)
          addonToken.value = response.tenant.agente.token
        }
        
        if (response.tenant.agente?.url) {
          localStorage.setItem('agentUrl', response.tenant.agente.url)
          agentUrl.value = response.tenant.agente.url
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao recarregar dados:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  
  try {
    // Buscar dados atualizados do tenant da API
    const tenantId = authStore.portalUser?.id || localStorage.getItem('tenantId') || ''
    const token = authStore.portalToken || localStorage.getItem('portalToken') || ''
    
    if (tenantId && token) {
      const response = await tenantsService.getTenant(tenantId, token)
      
      if (response.success && response.tenant) {
        // Atualizar localStorage com dados mais recentes
        if (response.tenant.agente?.token) {
          localStorage.setItem('agentToken', response.tenant.agente.token)
          addonToken.value = response.tenant.agente.token
        }
        
        if (response.tenant.agente?.url) {
          localStorage.setItem('agentUrl', response.tenant.agente.url)
          agentUrl.value = response.tenant.agente.url
        }
        
        appToken.value = tenantId
      } else {
        // Fallback para localStorage se API falhar
        addonToken.value = localStorage.getItem('agentToken') || ''
        agentUrl.value = localStorage.getItem('agentUrl') || ''
        appToken.value = tenantId
      }
    } else {
      // Carregar do localStorage como fallback
      addonToken.value = localStorage.getItem('agentToken') || ''
      agentUrl.value = localStorage.getItem('agentUrl') || ''
      appToken.value = tenantId
    }
  } catch (error) {
    console.error('❌ Erro ao buscar dados do tenant:', error)
    // Fallback para localStorage
    const tenantId = authStore.portalUser?.id || localStorage.getItem('tenantId') || ''
    addonToken.value = localStorage.getItem('agentToken') || ''
    agentUrl.value = localStorage.getItem('agentUrl') || ''
    appToken.value = tenantId
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="install-page">
    <div class="page-header">
      <h1>Instalar Addon MK-Edge</h1>
      <button @click="reloadTenantData" class="btn-reload" :disabled="loading">
        🔄 Atualizar Configuração
      </button>
    </div>

    <div class="install-content">
      
      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <p>Carregando configuração...</p>
      </div>
      
      <!-- Configuração -->
      <div v-else class="config-section">
        <h2>Configuração</h2>
        
        <div class="config-grid">
          <div class="config-item">
            <label>Token do Addon MK-Edge</label>
            <code>{{ addonToken || 'Aguardando configuração...' }}</code>
          </div>
          
          <div class="config-item">
            <label>URL do Agente MK-Auth</label>
            <code>{{ agentUrl || 'Não configurado' }}</code>
          </div>

          <div class="config-item">
            <label>Token do App MK-Edge</label>
            <code>{{ appToken || 'Não disponível' }}</code>
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
  width: 100%;
}

.page-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-reload {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-reload:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-reload:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
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

@media (max-width: 768px) {
  .install-page {
    padding: 1.25rem;
  }

  .config-section {
    padding: 1.25rem;
  }

  .install-step {
    flex-direction: column;
    align-items: flex-start;
  }

  .command-box {
    padding-right: 1rem;
    word-break: break-word;
  }

  .btn-copy-inline {
    position: relative;
    display: inline-flex;
    margin-top: 0.75rem;
  }
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
