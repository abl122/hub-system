<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { emailService } from '@/services/emailService'

interface EmailConfig {
  smtp_host: string
  smtp_port: number
  username: string
  password: string
  from_email: string
  from_name: string
  enabled: boolean
}

const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const message = ref({ type: '', text: '' })

const config = ref<EmailConfig>({
  smtp_host: '',
  smtp_port: 587,
  username: '',
  password: '',
  from_email: '',
  from_name: 'MK-Edge',
  enabled: false
})

const loadConfig = async () => {
  loading.value = true
  try {
    if (!authStore.adminToken) throw new Error('Token admin ausente')
    const response = await emailService.getConfig(authStore.adminToken)
    if (response?.config) {
      config.value = {
        smtp_host: response.config.smtp_host || '',
        smtp_port: response.config.smtp_port || 587,
        username: response.config.username || '',
        password: response.config.password || '',
        from_email: response.config.from_email || '',
        from_name: response.config.from_name || 'MK-Edge',
        enabled: !!response.config.enabled
      }
    }
  } catch (err) {
    console.warn('Email não configurado ainda', err)
  } finally {
    loading.value = false
  }
}

const handleTest = async () => {
  testing.value = true
  message.value = { type: '', text: '' }

  try {
    if (!config.value.smtp_host || !config.value.from_email) {
      message.value = {
        type: 'error',
        text: 'SMTP Host e Email de Origem são obrigatórios'
      }
      return
    }

    if (!authStore.adminToken) throw new Error('Token admin ausente')

    // Usa o email do próprio remetente como destino do teste
    const response = await emailService.testConnection(authStore.adminToken, config.value.from_email)

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
    if (!config.value.smtp_host || !config.value.from_email) {
      message.value = {
        type: 'error',
        text: 'SMTP Host e Email de Origem são obrigatórios'
      }
      return
    }

    if (!authStore.adminToken) throw new Error('Token admin ausente')

    const response = await emailService.updateConfig({
      enabled: config.value.enabled,
      smtp_host: config.value.smtp_host,
      smtp_port: config.value.smtp_port,
      username: config.value.username,
      password: config.value.password,
      from_email: config.value.from_email,
      from_name: config.value.from_name
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
  <div class="admin-email">
    <div class="page-header">
      <div>
        <h1>📧 Email (SMTP)</h1>
        <p class="subtitle">Integração SMTP para envio de emails automáticos</p>
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
          <label for="smtpHost">SMTP Host *</label>
          <input 
            id="smtpHost"
            v-model="config.smtp_host"
            type="text"
            placeholder="smtp.gmail.com | smtp.office365.com"
            class="input-field"
            :disabled="saving || testing"
          />
        </div>

        <div class="form-group">
          <label for="smtpPort">SMTP Port *</label>
          <input 
            id="smtpPort"
            v-model.number="config.smtp_port"
            type="number"
            placeholder="587"
            class="input-field"
            :disabled="saving || testing"
          />
        </div>

        <div class="form-group">
          <label for="username">Username / Email</label>
          <input 
            id="username"
            v-model="config.username"
            type="text"
            placeholder="seu.email@gmail.com"
            class="input-field"
            :disabled="saving || testing"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            id="password"
            v-model="config.password"
            type="text"
            placeholder="Sua senha ou app password"
            class="input-field"
            :disabled="saving || testing"
          />
        </div>

        <div class="form-group">
          <label for="fromEmail">Email de Origem *</label>
          <input 
            id="fromEmail"
            v-model="config.from_email"
            type="email"
            placeholder="noreply@seudominio.com"
            class="input-field"
            :disabled="saving || testing"
          />
        </div>

        <div class="form-group">
          <label for="fromName">Nome do Remetente</label>
          <input 
            id="fromName"
            v-model="config.from_name"
            type="text"
            placeholder="MK-Edge"
            class="input-field"
            :disabled="saving || testing"
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
.admin-email {
  padding: 2rem;
  padding-left: 0;
  /* background: #f5f5f5; */
  min-height: 100vh;
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
