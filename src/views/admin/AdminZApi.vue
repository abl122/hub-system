<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { zapiService } from '@/services/zapiService'

const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const message = ref({ type: '', text: '' })

const instanceId = ref('')
const instanceToken = ref('')
const securityToken = ref('')

const loadConfigurations = async () => {
  loading.value = true
  try {
    if (!authStore.adminToken) {
      throw new Error('Token de autenticação não disponível (adminToken vazio)')
    }

    const response = await zapiService.getConfig(authStore.adminToken)
    
    if (response?.config) {
      const config = response.config
      instanceId.value = config.instanceId || ''
      instanceToken.value = config.instanceToken || ''
      securityToken.value = config.securityToken || ''
    }
  } catch (err: any) {
    message.value = { type: 'error', text: 'Erro ao carregar: ' + (err.message || JSON.stringify(err)) }
  } finally {
    loading.value = false
  }
}

const handleTest = async () => {
  testing.value = true
  message.value = { type: '', text: '' }

  try {
    if (!instanceId.value || !instanceToken.value || !securityToken.value) {
      message.value = {
        type: 'error',
        text: 'Instance ID, Token e Security Token sao obrigatorios'
      }
      return
    }

    const response = await zapiService.testConnection(authStore.adminToken!, {
      instanceId: instanceId.value.trim(),
      instanceToken: instanceToken.value.trim()
    })

    if (response?.success) {
      message.value = {
        type: 'success',
        text: 'Conexao testada com sucesso! Status: ' + (response.status || 'connected')
      }
    } else {
      message.value = {
        type: 'error',
        text: response?.message || 'Erro ao testar conexao'
      }
    }
  } catch (error: any) {
    message.value = {
      type: 'error',
      text: error.message || 'Erro ao testar conexao'
    }
  } finally {
    testing.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  message.value = { type: '', text: '' }

  try {
    const id = (instanceId.value ?? '').toString().trim()
    const token = (instanceToken.value ?? '').toString().trim()
    const security = (securityToken.value ?? '').toString().trim()
    
    if (!id || !token) {
      message.value = { type: 'error', text: 'Instance ID e Token sao obrigatorios' }
      return
    }

    const response = await zapiService.updateConfig({
      instanceId: id,
      instanceToken: token,
      securityToken: security
    }, authStore.adminToken!)

    if (response?.success) {
      message.value = { type: 'success', text: 'Configuracao salva com sucesso!' }
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
  loadConfigurations()
})
</script>

<template>
  <div class="admin-zapi">
    <div class="page-header">
      <div>
        <h1>💬 Z-API (WhatsApp)</h1>
        <p class="subtitle">Z-API para envio de mensagens</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>

    <div v-else class="content">
      <section class="section">
        <h2>🔑 Configuracao de Credenciais</h2>
        
        <div v-if="message.text" :class="['message', 'message-' + message.type]">
          {{ message.text }}
        </div>

        <div class="form-group">
          <label for="instanceId">ID da Instancia *</label>
          <input 
            id="instanceId"
            v-model="instanceId"
            type="text"
            placeholder="3DEB3AF1B45D702DB6114AF752FBD4C9"
            class="input-field"
            :disabled="saving || testing"
          />
        </div>

        <div class="form-group">
          <label for="instanceToken">Token da Instancia *</label>
          <input 
            id="instanceToken"
            v-model="instanceToken"
            type="text"
            placeholder="Seu token da instancia"
            class="input-field"
            :disabled="saving || testing"
          />
        </div>

        <div class="form-group">
          <label for="securityToken">Token de Seguranca (Opcional)</label>
          <input 
            id="securityToken"
            v-model="securityToken"
            type="text"
            placeholder="Token de seguranca (se necessario)"
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
            <span v-if="!saving">💾 Salvar Configuracao</span>
            <span v-else>Salvando...</span>
          </button>
          <button 
            @click="handleTest"
            class="btn btn-secondary"
            :disabled="saving || testing"
          >
            <span v-if="!testing">🧪 Testar Conexao</span>
            <span v-else>Testando...</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-zapi {
  /* padding: 2rem; */
  padding-left: 0;
  /* background: #f5f5f5; */
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  /* margin-top: 2rem; */
  gap: 2rem;
}

.page-header h1 {
  margin: 24px 0 0.5rem;
  font-size: 1.5rem;
  color: #1f2937;
  text-align: left;
}

.subtitle {
  margin: 0 0 1.5rem;
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
  padding: 12px;
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

@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
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
