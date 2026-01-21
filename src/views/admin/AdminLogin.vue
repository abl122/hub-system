<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import passwordRecoveryService from '@/services/passwordRecoveryService'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showRecoveryModal = ref(false)
const recoveryStep = ref<'identification' | 'method' | 'verification'>('identification')
const recoveryUsername = ref('')
const recoveryMethod = ref<'sms' | 'whatsapp' | 'email'>('sms')
const recoveryContact = ref('')
const recoveryCode = ref('')
const recoveryNewPassword = ref('')
const recoveryConfirmPassword = ref('')
const recoveryLoading = ref(false)
const recoveryError = ref('')
const recoverySuccess = ref('')
const recoveryContacts = ref({
  phoneMasked: '',
  emailMasked: '',
  phoneAvailable: false,
  emailAvailable: false,
  smsEnabled: false,
  whatsappEnabled: false,
  emailEnabled: true
})

const openRecoveryModal = () => {
  showRecoveryModal.value = true
  recoveryStep.value = 'identification'
  recoveryUsername.value = ''
  recoveryContact.value = ''
  recoveryCode.value = ''
  recoveryNewPassword.value = ''
  recoveryConfirmPassword.value = ''
  recoveryError.value = ''
  recoverySuccess.value = ''
  recoveryContacts.value = {
    phoneMasked: '',
    emailMasked: '',
    phoneAvailable: false,
    emailAvailable: false,
    smsEnabled: false,
    whatsappEnabled: false,
    emailEnabled: true
  }
}

const closeRecoveryModal = () => {
  showRecoveryModal.value = false
  recoveryStep.value = 'identification'
  recoveryUsername.value = ''
  recoveryContact.value = ''
  recoveryCode.value = ''
  recoveryNewPassword.value = ''
  recoveryConfirmPassword.value = ''
  recoveryError.value = ''
  recoverySuccess.value = ''
  recoveryContacts.value = {
    phoneMasked: '',
    emailMasked: '',
    phoneAvailable: false,
    emailAvailable: false,
    smsEnabled: false,
    whatsappEnabled: false,
    emailEnabled: true
  }
}

const proceedToRecoveryMethod = () => {
  if (!recoveryUsername.value) {
    recoveryError.value = 'Por favor, informe seu usuário'
    return
  }
  recoveryError.value = ''
  fetchContacts()
}

const fetchContacts = async () => {
  recoveryLoading.value = true
  recoveryError.value = ''
  recoverySuccess.value = ''
  try {
    const { data } = await passwordRecoveryService.getContacts(recoveryUsername.value)
    recoveryContacts.value = data

    // Define método padrão baseado nos disponíveis
    if (data.smsEnabled && data.phoneAvailable) {
      recoveryMethod.value = 'sms'
    } else if (data.whatsappEnabled && data.phoneAvailable) {
      recoveryMethod.value = 'whatsapp'
    } else if (data.emailEnabled && data.emailAvailable) {
      recoveryMethod.value = 'email'
    }

    if (!data.phoneAvailable && !data.emailAvailable) {
      recoveryError.value = 'Nenhum contato cadastrado. Fale com o suporte.'
    } else {
      recoveryStep.value = 'method'
    }
  } catch (err: any) {
    recoveryError.value = err.response?.data?.message || 'Não foi possível carregar os contatos'
  } finally {
    recoveryLoading.value = false
  }
}

const requestRecovery = async () => {
  recoveryLoading.value = true
  recoveryError.value = ''
  recoverySuccess.value = ''

  try {
    if (recoveryMethod.value === 'sms') {
      await passwordRecoveryService.requestSmsRecovery(recoveryUsername.value)
      recoverySuccess.value = 'Código enviado por SMS! Verifique seu telefone.'
    } else if (recoveryMethod.value === 'whatsapp') {
      await passwordRecoveryService.requestWhatsappRecovery(recoveryUsername.value)
      recoverySuccess.value = 'Código enviado por WhatsApp! Verifique seu telefone.'
    } else if (recoveryMethod.value === 'email') {
      await passwordRecoveryService.requestEmailRecovery(recoveryUsername.value)
      recoverySuccess.value = 'Código enviado por Email! Verifique sua caixa de entrada.'
    }
    
    // Ir para o passo 3 (inserir código e nova senha)
    setTimeout(() => {
      recoveryStep.value = 'verification'
      recoveryError.value = ''
      recoverySuccess.value = ''
    }, 1500)
  } catch (err: any) {
    recoveryError.value = err.response?.data?.message || 'Erro ao enviar código. Tente novamente.'
    console.error('Erro ao solicitar recuperação:', err)
  } finally {
    recoveryLoading.value = false
  }
}

const verifyCodeAndReset = async () => {
  // Validações
  if (!recoveryCode.value || recoveryCode.value.length !== 6) {
    recoveryError.value = 'Código deve ter 6 dígitos'
    return
  }

  if (!recoveryNewPassword.value) {
    recoveryError.value = 'Informe a nova senha'
    return
  }

  if (recoveryNewPassword.value.length < 6) {
    recoveryError.value = 'Senha deve ter no mínimo 6 caracteres'
    return
  }

  if (recoveryNewPassword.value !== recoveryConfirmPassword.value) {
    recoveryError.value = 'As senhas não coincidem'
    return
  }

  recoveryLoading.value = true
  recoveryError.value = ''
  recoverySuccess.value = ''

  try {
    await passwordRecoveryService.verifyCodeAndReset(
      recoveryUsername.value,
      recoveryCode.value,
      recoveryNewPassword.value
    )
    
    recoverySuccess.value = '✅ Senha alterada com sucesso! Você pode fazer login agora.'
    
    // Fechar modal após 2 segundos
    setTimeout(() => {
      closeRecoveryModal()
      // Preencher o usuário no login
      username.value = recoveryUsername.value
    }, 2000)
  } catch (err: any) {
    recoveryError.value = err.response?.data?.message || 'Código inválido ou expirado. Tente novamente.'
    console.error('Erro ao verificar código:', err)
  } finally {
    recoveryLoading.value = false
  }
}

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'Preencha todos os campos'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const success = await authStore.loginAdmin(username.value, password.value)
    if (success) {
      router.push({ name: 'admin-dashboard' })
    } else {
      error.value = 'Falha ao fazer login. Verifique suas credenciais.'
    }
  } catch (err) {
    error.value = 'Erro ao conectar ao servidor'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleKeypress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleLogin()
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h2>MK-Edge Admin</h2>
      <p class="subtitle">Painel administrativo</p>

      <form @submit.prevent="handleLogin" @keypress="handleKeypress">
        <div class="form-group">
          <label for="username">Usuário</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Digite seu usuário"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Senha</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Digite sua senha"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="loading"
        >
          {{ loading ? 'Conectando...' : 'Entrar' }}
        </button>

        <button
          type="button"
          class="link-button"
          @click="openRecoveryModal"
        >
          Esqueceu a senha?
        </button>
      </form>

    </div>

    <!-- Recovery Modal -->
    <div v-if="showRecoveryModal" class="modal-overlay" @click="closeRecoveryModal">
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <h3>Recuperar Senha</h3>
          <button 
            type="button"
            class="modal-close"
            @click="closeRecoveryModal"
          >
            ✕
          </button>
        </div>

        <div class="modal-body">
          <!-- Step 1: Identification -->
          <div v-if="recoveryStep === 'identification'" class="recovery-step">
            <p class="step-description">Informe seu usuário para recuperar a senha</p>
            
            <div class="form-group">
              <label for="recovery-username">Usuário</label>
              <input
                id="recovery-username"
                v-model="recoveryUsername"
                type="text"
                placeholder="Digite seu usuário"
                class="form-control"
              />
            </div>

            <div v-if="recoveryError" class="error-message">
              {{ recoveryError }}
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeRecoveryModal"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click="proceedToRecoveryMethod"
              >
                Próximo
              </button>
            </div>
          </div>

          <!-- Step 2: Method Selection -->
          <div v-if="recoveryStep === 'method'" class="recovery-step">
            <p class="step-description">Como deseja receber o código?</p>

            <div class="recovery-method-selector">
              <label class="method-option">
                <input
                  v-model="recoveryMethod"
                  type="radio"
                  value="sms"
                  name="recovery-method"
                  :disabled="!recoveryContacts.phoneAvailable || !recoveryContacts.smsEnabled"
                />
                <span class="method-label">
                  <span class="method-icon">📱</span>
                  <span class="method-text">SMS</span>
                </span>
              </label>

              <label class="method-option">
                <input
                  v-model="recoveryMethod"
                  type="radio"
                  value="whatsapp"
                  name="recovery-method"
                  :disabled="!recoveryContacts.phoneAvailable || !recoveryContacts.whatsappEnabled"
                />
                <span class="method-label">
                  <span class="method-icon">💬</span>
                  <span class="method-text">WhatsApp</span>
                </span>
              </label>

              <label class="method-option">
                <input
                  v-model="recoveryMethod"
                  type="radio"
                  value="email"
                  name="recovery-method"
                  :disabled="!recoveryContacts.emailAvailable"
                />
                <span class="method-label">
                  <span class="method-icon">✉️</span>
                  <span class="method-text">Email</span>
                </span>
              </label>
            </div>

              <div class="form-group masked-info">
                <div v-if="recoveryContacts.phoneAvailable" class="masked-line">
                  <strong>Telefone:</strong> {{ recoveryContacts.phoneMasked || '—' }}
                </div>
                <div v-if="recoveryContacts.emailAvailable" class="masked-line">
                  <strong>Email:</strong> {{ recoveryContacts.emailMasked || '—' }}
                </div>
              </div>

            <div v-if="recoveryError" class="error-message">
              {{ recoveryError }}
            </div>

            <div v-if="recoverySuccess" class="success-message">
              {{ recoverySuccess }}
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-secondary"
                @click="recoveryStep = 'identification'; recoveryError = ''"
              >
                Voltar
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="recoveryLoading"
                @click="requestRecovery"
              >
                {{ recoveryLoading ? 'Enviando...' : 'Enviar Código' }}
              </button>
            </div>
          </div>

          <!-- Step 3: Code Verification & Password Reset -->
          <div v-if="recoveryStep === 'verification'" class="recovery-step">
            <p class="step-description">Digite o código de 6 dígitos que você recebeu e defina uma nova senha</p>

            <div class="form-group">
              <label for="recovery-code">Código de Verificação</label>
              <input
                id="recovery-code"
                v-model="recoveryCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="000000"
                class="form-control code-input"
                @input="recoveryCode = recoveryCode.replace(/\D/g, '')"
              />
              <small class="form-hint">Digite o código de 6 dígitos recebido</small>
            </div>

            <div class="form-group">
              <label for="recovery-new-password">Nova Senha</label>
              <input
                id="recovery-new-password"
                v-model="recoveryNewPassword"
                type="password"
                placeholder="Digite sua nova senha"
                class="form-control"
              />
              <small class="form-hint">Mínimo de 6 caracteres</small>
            </div>

            <div class="form-group">
              <label for="recovery-confirm-password">Confirmar Nova Senha</label>
              <input
                id="recovery-confirm-password"
                v-model="recoveryConfirmPassword"
                type="password"
                placeholder="Confirme sua nova senha"
                class="form-control"
              />
            </div>

            <div v-if="recoveryError" class="error-message">
              {{ recoveryError }}
            </div>

            <div v-if="recoverySuccess" class="success-message">
              {{ recoverySuccess }}
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-secondary"
                @click="recoveryStep = 'method'; recoveryError = ''; recoveryCode = ''; recoveryNewPassword = ''; recoveryConfirmPassword = ''"
              >
                Voltar
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="recoveryLoading"
                @click="verifyCodeAndReset"
              >
                {{ recoveryLoading ? 'Verificando...' : 'Redefinir Senha' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  width: 100%;
  max-width: 450px;
  padding: 20px;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-card h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: #333;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #999;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  text-align: left;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.2s;
  background: white;
  color: #1f2937;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

.link-button {
  background: none;
  border: none;
  color: #667eea;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  transition: color 0.2s;
  width: 100%;
  text-align: center;
}

.link-button:hover {
  color: #5568d3;
}

/* Modal Styles */
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

.modal-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 450px;
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.recovery-method-label {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f0f4ff;
  border-left: 4px solid #667eea;
  border-radius: 4px;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.masked-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 1rem;
  color: #1f2937;
}

.masked-line + .masked-line {
  margin-top: 0.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-secondary {
  background: #e5e7eb;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d1d5db;
}

.recovery-step {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-description {
  margin-bottom: 1.5rem;
  color: #666;
  font-size: 0.95rem;
  text-align: center;
}

.recovery-method-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.method-option {
  position: relative;
  cursor: pointer;
}

.method-option input[type="radio"] {
  display: none;
}

.method-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-align: center;
}

.method-option input[type="radio"]:checked + .method-label {
  border-color: #667eea;
  background: #f0f4ff;
}

.method-icon {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.method-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.method-option input[type="radio"]:checked + .method-label .method-text {
  color: #667eea;
}

/* Code Input */
.code-input {
  font-size: 1.5rem !important;
  letter-spacing: 0.5rem;
  text-align: center;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.form-hint {
  display: block;
  margin-top: 0.4rem;
  color: #6b7280;
  font-size: 0.8rem;
}

/* Disable hover on disabled methods */
.method-option input[type="radio"]:disabled + .method-label {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f9fafb;
}
</style>

