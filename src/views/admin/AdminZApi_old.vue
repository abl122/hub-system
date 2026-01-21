<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { zapiService } from '@/services/zapiService'

const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const message = ref({ type: '', text: '' })

const form = ref({
  instanceId: '',
  instanceToken: '',
  securityToken: ''
})

const loadConfigurations = async () => {
  loading.value = true
  try {
    if (authStore.adminToken) {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
      const configPromise = zapiService.getConfig(authStore.adminToken)
      const zapiConfig = await Promise.race([configPromise, timeoutPromise])
      
      if (zapiConfig?.success && zapiConfig?.config) {
        form.value = {
          instanceId: zapiConfig.config.instanceId || '',
          instanceToken: zapiConfig.config.instanceToken || '',
          securityToken: zapiConfig.config.securityToken || ''
        }
      }
    }
  } catch (error) {
    console.warn('Z-API config error:', error)
  } finally {
    loading.value = false
  }
}

const handleTest = async () => {
  testing.value = true
  message.value = { type: '', text: '' }

  try {
    if (!form.value.instanceId || !form.value.instanceToken || !form.value.securityToken) {
      message.value = {
        type: 'error',
        text: 'Instance ID, Token e Security Token são obrigatórios'
      }
      return
    }

    const result = await zapiService.testConnection(authStore.adminToken, {
      instanceId: form.value.instanceId,
      instanceToken: form.value.instanceToken,
      securityToken: form.value.securityToken
    })

    if (result.success && result.connected) {
      message.value = {
        type: 'success',
        text: '✅ Conexão testada com sucesso!'
      }
    } else {
      message.value = {
        type: 'error',
        text: result.message || 'Falha ao conectar'
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
    if (!form.value.instanceId || !form.value.instanceToken) {
      message.value = { type: 'error', text: 'Instance ID e Token são obrigatórios' }
      return
    }

    const result = await zapiService.updateConfig({
      instanceId: form.value.instanceId,
      instanceToken: form.value.instanceToken,
      securityToken: form.value.securityToken || ''
    }, authStore.adminToken)

    if (result.success) {
      message.value = { type: 'success', text: '✅ Configuração salva com sucesso!' }
    } else {
      message.value = { type: 'error', text: result.message || 'Erro ao salvar' }
    }
  } catch (error: any) {
    message.value = { type: 'error', text: error.message || 'Erro ao salvar' }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfigurations()
})
</script>

<template>
  <div class="admin-zapi">
    <div class="page-header">
      <div>
        <h1>💬 Z-API (WhatsApp)</h1>
        <p class="subtitle">Integração Z-API para envio de mensagens WhatsApp</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>
    <div v-else class="content">
      <section class="section">
        <h2>🔑 Configuração de Credenciais</h2>
        <div v-if="message.text" :class="['message', 'message-' + message.type]">
          {{ message.text }}
        </div>

        <div class="form-group">
          <label for="instanceId">ID da Instância *</label>
          <input id="instanceId" v-model="form.instanceId" type="text" placeholder="3DEB3AF1B45D702DB6114AF752FBD4C9" class="input-field" :disabled="saving || testing" />
        </div>

        <div class="form-group">
          <label for="instanceToken">Token da Instância</label>
          <input id="instanceToken" v-model="form.instanceToken" type="text" placeholder="Seu token da instância" class="input-field" :disabled="saving || testing" />
        </div>

        <div class="form-group">
          <label for="securityToken">Token de Segurança (Opcional)</label>
          <input id="securityToken" v-model="form.securityToken" type="text" placeholder="Token de segurança (se necessário)" class="input-field" :disabled="saving || testing" />
        </div>

        <div class="button-group">
          <button @click="handleSave" class="btn btn-primary" :disabled="saving || testing">
            <span v-if="!saving">💾 Salvar Configuração</span>
            <span v-else>Salvando...</span>
          </button>
          <button @click="handleTest" class="btn btn-secondary" :disabled="saving || testing">
            <span v-if="!testing">🧪 Testar Conexão</span>
            <span v-else>Testando...</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-zapi {
  max-width: 100%;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--primary);
  font-weight: 600;
  font-size: 1.05rem;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background: var(--bg-white);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.75rem;
  box-shadow: var(--shadow-sm);
}

.section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: var(--text-primary);
  font-weight: 700;
  border-bottom: 2px solid var(--border);
  padding-bottom: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-field {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  background: var(--bg-white);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.input-field::placeholder {
  color: var(--text-light);
}

.input-field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-field:disabled {
  background: var(--bg-light);
  cursor: not-allowed;
  opacity: 0.6;
}

.button-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.btn {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: linear-gradient(135deg, var(--secondary) 0%, #047857 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.message {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  border-left: 4px solid;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-success {
  background: #dcfce7;
  color: #166534;
  border-color: #86efac;
}

.message-success::before {
  content: '✓';
  font-size: 1.25rem;
  flex-shrink: 0;
}

.message-error {
  background: var(--danger-light);
  color: var(--danger);
  border-color: #fca5a5;
}

.message-error::before {
  content: '✕';
  font-size: 1.25rem;
  flex-shrink: 0;
}

.setup-steps {
  display: grid;
  gap: 1.5rem;
}

.step {
  display: flex;
  gap: 1.5rem;
  background: var(--bg-light);
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid var(--primary);
  transition: all 0.2s ease;
}

.step:hover {
  box-shadow: var(--shadow-sm);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-weight: 700;
}

.step-content p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.step-content ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

.step-content li {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--primary-light) 0%, #f0f0ff 100%);
  border: 2px solid var(--border);
  border-radius: 8px;
  text-decoration: none;
  color: var(--primary);
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
}

.link-card:hover {
  border-color: var(--primary);
  background: var(--primary-light);
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.link-icon {
  font-size: 1.75rem;
}

@media (max-width: 1024px) {
  .button-group {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .section {
    padding: 1.25rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .section h2 {
    font-size: 1.1rem;
  }

  .step {
    gap: 1rem;
  }

  .links-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .button-group {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .section {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .links-grid {
    grid-template-columns: 1fr;
  }
}

