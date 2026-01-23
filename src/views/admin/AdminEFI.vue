<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { efiService } from '@/services/efiService'

type EnvironmentKey = 'homologacao' | 'producao'

interface EnvironmentConfig {
  client_id: string
  client_secret: string
  pix_key: string
  has_certificate: boolean
  certificate_filename: string | null
}

interface EFIConfig {
  sandbox: boolean
  enabled: boolean
  homologacao: EnvironmentConfig
  producao: EnvironmentConfig
}

const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const uploading = ref(false)
const message = ref({ type: '', text: '' })
const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const pendingFileName = ref('')

const config = ref<EFIConfig>({
  sandbox: true,
  enabled: false,
  homologacao: {
    client_id: '',
    client_secret: '',
    pix_key: '',
    has_certificate: false,
    certificate_filename: null
  },
  producao: {
    client_id: '',
    client_secret: '',
    pix_key: '',
    has_certificate: false,
    certificate_filename: null
  }
})

const selectedEnv = ref<EnvironmentKey>('homologacao')

const currentEnvConfig = computed(() => config.value[selectedEnv.value])

const certificateStatusText = computed(() => ({
  homologacao: config.value.homologacao.has_certificate
    ? config.value.homologacao.certificate_filename || 'Certificado enviado'
    : 'Nenhum certificado',
  producao: config.value.producao.has_certificate
    ? config.value.producao.certificate_filename || 'Certificado enviado'
    : 'Nenhum certificado'
}))

const selectedStatusText = computed(() => {
  const env = selectedEnv.value
  const cfg = config.value[env]
  return cfg.has_certificate
    ? cfg.certificate_filename || 'Certificado enviado'
    : 'Nenhum certificado'
})

const clientId = computed({
  get: () => config.value[selectedEnv.value].client_id,
  set: (val) => { config.value[selectedEnv.value].client_id = val }
})

const clientSecret = computed({
  get: () => config.value[selectedEnv.value].client_secret,
  set: (val) => { config.value[selectedEnv.value].client_secret = val }
})

const pixKey = computed({
  get: () => config.value[selectedEnv.value].pix_key,
  set: (val) => { config.value[selectedEnv.value].pix_key = val }
})

watch(selectedEnv, (val) => {
  config.value.sandbox = val === 'homologacao'
  pendingFile.value = null
  pendingFileName.value = ''
})

const loadConfig = async () => {
  loading.value = true
  try {
    if (!authStore.adminToken) throw new Error('Token admin ausente')
    const response = await efiService.getConfig(authStore.adminToken)
    if (response?.config) {
      const legacyClientId = (response.config as any).client_id || ''
      const legacyClientSecret = (response.config as any).client_secret || ''
      const legacyPixKey = (response.config as any).pix_key || ''
      const legacyEnv = (response.config as any).environment || 'sandbox'

      config.value = {
        sandbox: response.config.sandbox !== false,
        enabled: !!response.config.enabled,
        homologacao: {
          client_id: response.config.homologacao?.client_id || legacyClientId,
          client_secret: response.config.homologacao?.client_secret || legacyClientSecret,
          pix_key: response.config.homologacao?.pix_key || legacyPixKey,
          has_certificate: !!response.config.homologacao?.has_certificate,
          certificate_filename: response.config.homologacao?.certificate_filename || null
        },
        producao: {
          client_id: response.config.producao?.client_id || legacyClientId,
          client_secret: response.config.producao?.client_secret || legacyClientSecret,
          pix_key: response.config.producao?.pix_key || legacyPixKey,
          has_certificate: !!response.config.producao?.has_certificate,
          certificate_filename: response.config.producao?.certificate_filename || null
        }
      }

      // Se apenas o modelo antigo existir, respeita o ambiente salvo
      if (!response.config.homologacao?.client_id && !response.config.producao?.client_id) {
        selectedEnv.value = legacyEnv === 'production' ? 'producao' : 'homologacao'
        config.value.sandbox = selectedEnv.value === 'homologacao'
      } else {
        selectedEnv.value = config.value.sandbox ? 'homologacao' : 'producao'
      }
    }
  } catch (err) {
    console.warn('EFI não configurado ainda', err)
  } finally {
    loading.value = false
  }
}

const handleTest = async () => {
  testing.value = true
  message.value = { type: '', text: '' }

  try {
    if (!currentEnvConfig.value.client_id || !currentEnvConfig.value.client_secret) {
      message.value = {
        type: 'error',
        text: 'Client ID e Client Secret são obrigatórios'
      }
      return
    }

    if (!authStore.adminToken) throw new Error('Token admin ausente')

    const response = await efiService.testConnection(authStore.adminToken)

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
    if (!currentEnvConfig.value.client_id || !currentEnvConfig.value.client_secret) {
      message.value = {
        type: 'error',
        text: 'Client ID e Client Secret são obrigatórios'
      }
      return
    }

    if (!authStore.adminToken) throw new Error('Token admin ausente')

    const response = await efiService.updateConfig({
      sandbox: selectedEnv.value === 'homologacao',
      enabled: config.value.enabled,
      homologacao_client_id: config.value.homologacao.client_id,
      homologacao_client_secret: config.value.homologacao.client_secret,
      homologacao_pix_key: config.value.homologacao.pix_key,
      producao_client_id: config.value.producao.client_id,
      producao_client_secret: config.value.producao.client_secret,
      producao_pix_key: config.value.producao.pix_key
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

const handleFileSelect = () => {
  fileInput.value?.click()
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    pendingFile.value = file
    pendingFileName.value = file.name
  }
}

const handleUpload = async () => {
  message.value = { type: '', text: '' }
  if (!pendingFile.value) {
    message.value = { type: 'error', text: 'Selecione um arquivo P12 antes de enviar.' }
    return
  }
  if (!authStore.adminToken) {
    message.value = { type: 'error', text: 'Token admin ausente' }
    return
  }

  uploading.value = true
  try {
    const response = await efiService.uploadCertificate(authStore.adminToken, selectedEnv.value, pendingFile.value)
    if (response?.success) {
      config.value[selectedEnv.value].has_certificate = true
      config.value[selectedEnv.value].certificate_filename = response.certificate?.filename || pendingFileName.value
      pendingFile.value = null
      pendingFileName.value = ''
      message.value = { type: 'success', text: response.message || 'Certificado enviado com sucesso' }
    } else {
      message.value = { type: 'error', text: response?.message || 'Erro ao enviar certificado' }
    }
  } catch (error: any) {
    message.value = { type: 'error', text: error.message || 'Erro ao enviar certificado' }
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="admin-efi">
    <div class="page-header">
      <div>
        <h1>💳 EFI (Gerencianet)</h1>
        <p class="subtitle">Integração EFI para processamento de pagamentos</p>
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

        <div class="env-select-row">
          <div class="form-group">
            <label for="environment">Ambiente ativo</label>
            <select 
              id="environment"
              v-model="selectedEnv"
              class="input-field"
              :disabled="saving || testing"
            >
              <option value="homologacao">🧪 Homologação (Sandbox)</option>
              <option value="producao">🚀 Produção</option>
            </select>
          </div>

          <div class="cert-status">
            <label>Status do Certificado</label>
            <span 
              class="status-chip" 
              :class="currentEnvConfig.has_certificate ? 'ok' : 'warn'"
            >
              {{ selectedStatusText }}
            </span>
          </div>
        </div>

        <div class="upload-row">
          <input
            ref="fileInput"
            type="file"
            accept=".p12"
            class="hidden-file-input"
            @change="onFileChange"
          />
          <button
            type="button"
            class="btn btn-light"
            @click="handleFileSelect"
            :disabled="saving || testing || uploading"
          >
            📂 Selecionar arquivo P12
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleUpload"
            :disabled="!pendingFile || saving || testing || uploading"
          >
            <span v-if="!uploading">⬆️ Enviar Certificado</span>
            <span v-else>Enviando...</span>
          </button>
          <span v-if="pendingFileName" class="file-name">{{ pendingFileName }}</span>
        </div>

        <div class="form-group">
          <label for="clientId">Client ID *</label>
          <input 
            id="clientId"
            v-model="clientId"
            type="text"
            placeholder="Client ID do ambiente selecionado"
            class="input-field"
            :disabled="saving || testing"
          />
        </div>

        <div class="form-group">
          <label for="clientSecret">Client Secret *</label>
          <input 
            id="clientSecret"
            v-model="clientSecret"
            type="text"
            placeholder="Client Secret do ambiente selecionado"
            class="input-field"
            :disabled="saving || testing"
          />
        </div>

        <div class="form-group">
          <label for="pixKey">Chave Pix</label>
          <input 
            id="pixKey"
            v-model="pixKey"
            type="text"
            placeholder="Chave Pix para o ambiente selecionado"
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
.admin-efi {
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
  text-align: left;
}

.form-group {
  margin-bottom: 1.5rem;
}

.env-select-row {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: end;
  margin-bottom: 1rem;
}

.env-select-row .form-group {
  margin-bottom: 0;
}

.cert-status {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-self: end;
}

.cert-status label {
  display: block;
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
  text-align: left;
  margin-bottom: 0.5rem;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.file-name {
  color: #059669;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-chip {
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
  border: 1px solid transparent;
  white-space: nowrap;
}

.status-chip.ok {
  background: #ecfdf3;
  color: #166534;
  border-color: #bbf7d0;
}

.status-chip.warn {
  background: #fff7ed;
  color: #9a3412;
  border-color: #fed7aa;
}

.btn-light {
  background: #e5e7eb;
  color: #111827;
}

.btn-light:hover:not(:disabled) {
  background: #d1d5db;
}

.hidden-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.hint {
  display: block;
  margin-top: 0.35rem;
  color: #6b7280;
  font-size: 0.85rem;
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
