<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { smsService } from '@/services/smsService'

interface SMSConfig {
  endpoint: string
  username: string
  password: string
  token: string
  method: 'GET' | 'POST'
  default_sender: string
  enabled: boolean
}

const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const message = ref({ type: '', text: '' })

const config = ref<SMSConfig>({
  endpoint: '172.31.255.6',
  username: '',
  password: '',
  token: '',
  method: 'POST',
  default_sender: 'MK-Edge',
  enabled: false
})

const loadConfig = async () => {
  loading.value = true
  try {
    if (!authStore.adminToken) throw new Error('Token admin ausente')
    const response = await smsService.getConfig(authStore.adminToken)
    if (response?.config) {
      config.value = {
        endpoint: response.config.endpoint || '',
        username: response.config.username || '',
        password: response.config.password || '',
        token: response.config.token || '',
        method: response.config.method || 'POST',
        default_sender: response.config.default_sender || 'MK-Edge',
        enabled: !!response.config.enabled
      }
    }
  } catch (err) {
    console.warn('SMS não configurado ainda', err)
  } finally {
    loading.value = false
  }
}

const handleTest = async () => {
  testing.value = true
  message.value = { type: '', text: '' }

  try {
    if (!config.value.endpoint) {
      message.value = {
        type: 'error',
        text: 'Endpoint é obrigatório'
      }
      return
    }

    if (!config.value.username) {
      message.value = {
        type: 'error',
        text: 'Username é obrigatório'
      }
      return
    }

    if (!config.value.password && !config.value.token) {
      message.value = {
        type: 'error',
        text: 'Password ou Token é obrigatório'
      }
      return
    }

    if (!authStore.adminToken) throw new Error('Token admin ausente')

    const response = await smsService.testConnection(authStore.adminToken, {
      endpoint: config.value.endpoint,
      username: config.value.username,
      password: config.value.password,
      token: config.value.token
    })

    if (response?.success) {
      message.value = {
        type: 'success',
        text: response.message || '✅ Conexão testada com sucesso!'
      }
    } else {
      message.value = {
        type: 'error',
        text: response?.message || 'Erro ao testar conexão'
      }
    }
  } catch (error: any) {
    message.value = {
      type: 'error',
      text: error.message || 'Erro ao testar conexão'
    }
  } finally {
    testing.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  message.value = { type: '', text: '' }

  try {
    if (!config.value.username) {
      message.value = {
        type: 'error',
        text: 'Username é obrigatório'
      }
      return
    }

    if (!config.value.password && !config.value.token) {
      message.value = {
        type: 'error',
        text: 'Password ou Token é obrigatório'
      }
      return
    }

    if (!authStore.adminToken) throw new Error('Token admin ausente')

    const response = await smsService.updateConfig({
      endpoint: config.value.endpoint,
      username: config.value.username,
      password: config.value.password,
      token: config.value.token,
      method: config.value.method,
      default_sender: config.value.default_sender,
      enabled: config.value.enabled
    }, authStore.adminToken)

    if (response?.success) {
      message.value = {
        type: 'success',
        text: response.message || '✅ Configuração salva com sucesso!'
      }
    } else {
      message.value = {
        type: 'error',
        text: response?.message || 'Erro ao salvar'
      }
    }
  } catch (error: any) {
    message.value = {
      type: 'error',
      text: error.message || 'Erro ao salvar'
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="admin-sms">
    <div class="page-header">
      <div>
        <h1>📱 SMS</h1>
        <p class="subtitle">Integração SMS para notificações automáticas</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>

    <div v-else class="content">
      <!-- Configuração de Credenciais -->
      <section class="section">
        <h2>🔑 Configuração de Credenciais</h2>
        
        <div v-if="message.text" :class="['message', 'message-' + message.type]">
          {{ message.text }}
        </div>

        <div class="form-group">
          <label for="endpoint">Endpoint *</label>
          <input 
            id="endpoint"
            v-model="config.endpoint"
            type="text"
            placeholder="IP ou domínio do servidor SMS"
            class="input-field"
            :disabled="saving || testing"
          />
        </div>

        <div class="form-group">
          <label for="username">Username *</label>
          <input 
            id="username"
            v-model="config.username"
            type="text"
            placeholder="Seu username no servidor SMS"
            class="input-field"
            :disabled="saving || testing"
          />
        </div>

        <div class="form-group">
          <label for="password">Password / Chave *</label>
          <input 
            id="password"
            v-model="config.password"
            type="text"
            placeholder="Campo 'p' do servidor SMS (geralmente um hash)"
            class="input-field"
            :disabled="saving || testing"
          />
          <small>⚠️ Este é o parâmetro 'p' esperado pelo servidor - a senha/chave de autenticação</small>
        </div>

        <div class="form-group">
          <label for="token">Token (Alternativo)</label>
          <input 
            id="token"
            v-model="config.token"
            type="text"
            placeholder="Se usar token ao invés de password"
            class="input-field"
            :disabled="saving || testing"
          />
          <small>Use password OU token, não ambos</small>
        </div>

        <div class="form-group">
          <label for="method">Método HTTP *</label>
          <select 
            id="method"
            v-model="config.method"
            class="input-field"
            :disabled="saving || testing"
          >
            <option value="GET">GET - Parâmetros na URL</option>
            <option value="POST">POST - Parâmetros no corpo</option>
          </select>
          <small>
            <strong>GET:</strong> http://servidor/sms?p=token&to=numero&msg=texto<br>
            <strong>POST:</strong> curl -X POST "http://servidor/sms" -d "p=token&to=numero&msg=texto"
          </small>
        </div>

        <div class="form-group">
          <label for="sender">Remetente Padrão</label>
          <input 
            id="sender"
            v-model="config.default_sender"
            type="text"
            placeholder="Nome ou número do remetente"
            class="input-field"
            :disabled="saving || testing"
            maxlength="11"
          />
        </div>

        <div class="button-group">
          <button 
            @click="handleSave"
            class="btn btn-primary"
            :disabled="saving || testing"
          >
            <span v-if="!saving">💾 Salvar Configuração</span>
            <span v-else>Salvando...</span>
          </button>
          <button 
            @click="handleTest"
            class="btn btn-secondary"
            :disabled="saving || testing"
          >
            <span v-if="!testing">🧪 Testar Conexão</span>
            <span v-else>Testando...</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-sms {
  padding: 2rem;
  padding-left: 0;
  /* background: #f5f5f5; */
  min-height: 100vh;
  max-width: 1200px;
  /* margin-left: 30px; */
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  /* margin-bottom: 2rem; */
  margin-top: 2rem;
  gap: 2rem;
}

.page-header h1 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  color: #1f2937;
  text-align: left;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
  text-align: left;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  max-width: 1200px;
}

.section h2 {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
  color: #1f2937;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0.75rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
  text-align: left;
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  background: white;
  color: #1f2937;
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
}

.input-field:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-primary {
  background: #0284c7;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0369a1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
}

.btn-secondary {
  background: #10b981;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message {
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.message-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.message-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
</style>
