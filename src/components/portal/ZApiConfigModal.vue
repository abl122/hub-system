<script setup lang="ts">
import { ref } from 'vue'
import { zapiService } from '@/services/zapiService'
import { useAuthStore } from '@/stores/auth'

interface Props {
  open: boolean
}

const emit = defineEmits<{
  close: []
  save: []
}>()

const props = defineProps<Props>()
const authStore = useAuthStore()
const loading = ref(false)
const testing = ref(false)
const error = ref('')
const success = ref('')

const form = ref({
  instanceId: import.meta.env.VITE_ZAPI_INSTANCE_ID || '3DEB3AF1B45D702DB6114AF752FBD4C9',
  instanceToken: import.meta.env.VITE_ZAPI_INSTANCE_TOKEN || '17485D404B8A0AEF5AC71095',
  securityToken: import.meta.env.VITE_ZAPI_SECURITY_TOKEN || 'Fa1b957e48d6f4c3d84405e1ad3447662S'
})

const handleTest = async () => {
  testing.value = true
  error.value = ''
  success.value = ''

  try {
    const token = authStore.portalToken
    if (!token) {
      throw new Error('Token não disponível')
    }

    // Testar com as credenciais do formulário
    const response = await zapiService.testConnection(token, {
      instanceId: form.value.instanceId,
      instanceToken: form.value.instanceToken,
      securityToken: form.value.securityToken
    })
    
    if (response.success && response.connected) {
      success.value = '✅ Conexão testada com sucesso!'
    } else {
      error.value = response.message || 'Falha ao conectar'
    }
  } catch (err: any) {
    error.value = err.message || 'Erro ao testar conexão'
    console.error('Erro ao testar Z-API:', err)
  } finally {
    testing.value = false
  }
}

const handleSave = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    if (!form.value.instanceId || !form.value.instanceToken) {
      throw new Error('Instance ID e Token são obrigatórios')
    }

    const token = authStore.portalToken
    if (!token) {
      throw new Error('Token não disponível')
    }

    const response = await zapiService.updateConfig(form.value, token)

    if (response.success) {
      success.value = '✅ Configuração salva com sucesso!'
      setTimeout(() => {
        emit('close')
        emit('save')
      }, 1500)
    } else {
      error.value = response.message || 'Erro ao salvar configuração'
    }
  } catch (err: any) {
    error.value = err.message || 'Erro ao salvar configuração'
    console.error('Erro ao salvar Z-API:', err)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div v-if="open" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>⚙️ Configurar Z-API (WhatsApp)</h2>
        <button class="btn-close" @click="handleClose">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>

        <div class="form-group">
          <label>ID da Instância</label>
          <input
            v-model="form.instanceId"
            type="text"
            placeholder="3DEB3AF1B45D702DB6114AF752FBD4C9"
            class="input"
          />
          <p class="form-hint">
            Você pode encontrar em <a href="https://z-api.io" target="_blank">z-api.io</a>
          </p>
        </div>

        <div class="form-group">
          <label>Token da Instância</label>
          <input
            v-model="form.instanceToken"
            type="password"
            placeholder="17485D404B8A0AEF5AC71095"
            class="input"
          />
        </div>

        <div class="form-group">
          <label>Token de Segurança</label>
          <input
            v-model="form.securityToken"
            type="password"
            placeholder="Fa1b957e48d6f4c3d84405e1ad3447662S"
            class="input"
          />
        </div>

        <div class="info-box">
          <strong>💡 Dica:</strong> Você pode encontrar esses dados no dashboard da Z-API em
          <a href="https://z-api.io/dashboard" target="_blank">z-api.io/dashboard</a>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose" :disabled="loading">
          Cancelar
        </button>
        <button class="btn btn-secondary" @click="handleTest" :disabled="loading || testing">
          {{ testing ? 'Testando...' : 'Testar Conexão' }}
        </button>
        <button class="btn btn-primary" @click="handleSave" :disabled="loading">
          {{ loading ? 'Salvando...' : 'Salvar Configuração' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #1f2937;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
}

.btn-close:hover {
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
  text-align: left;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: #fff !important;
  color: #1f2937 !important;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-hint {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.form-hint a {
  color: #3b82f6;
  text-decoration: none;
}

.form-hint a:hover {
  text-decoration: underline;
}

.info-box {
  background: #f0f9ff;
  border-left: 4px solid #0284c7;
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1e40af;
}

.info-box a {
  color: #0284c7;
  text-decoration: none;
  font-weight: 500;
}

.info-box a:hover {
  text-decoration: underline;
}

.alert {
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-weight: 500;
}

.alert-error {
  background: #fee2e2;
  border-left: 4px solid #dc2626;
  color: #991b1b;
}

.alert-success {
  background: #dcfce7;
  border-left: 4px solid #16a34a;
  color: #166534;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #f3f4f6;
}
</style>
