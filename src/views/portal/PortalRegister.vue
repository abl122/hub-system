<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { registerService } from '@/services/registerService'

const router = useRouter()
const route = useRoute()

interface Plan {
  _id: string
  nome: string
  slug: string
  descricao: string
  valor_mensal: number
  periodo: string
  recursos: string[]
  destaque: boolean
  cor: string
  dias_trial: number
  recorrente: boolean
}

const selectedPlan = ref<Plan | null>(null)
const loading = ref(false)
const error = ref('')
const success = ref('')
const currentStep = ref<'register' | 'payment'>('register')
const registrationData = ref<any>(null)

const formData = ref({
  // Dados do Provedor/Tenant
  nome: '',
  razao_social: '',
  cnpj: '',
  dominio: '',
  email: '',
  telefone: '',
  // Dados do Usuário Admin
  admin_nome: '',
  admin_email: '',
  senha: '',
  confirmar_senha: ''
})

const buttonText = computed(() => {
  if (!selectedPlan.value) return 'Continuar'
  return selectedPlan.value.recorrente ? '📝 Assinar' : '💎 Contratar'
})

const loadSelectedPlan = () => {
  const stored = localStorage.getItem('selected_plan')
  if (stored) {
    selectedPlan.value = JSON.parse(stored)
  }
}

const formatCpfCnpj = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  // CNPJ: 00.000.000/0000-00
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

const handleCpfCnpjInput = () => {
  formData.value.cnpj = formatCpfCnpj(formData.value.cnpj)
}

const handlePhoneInput = () => {
  formData.value.telefone = formatPhone(formData.value.telefone)
}

const validateForm = () => {
  if (!formData.value.nome || !formData.value.cnpj || !formData.value.email || 
      !formData.value.telefone || !formData.value.admin_nome || 
      !formData.value.admin_email || !formData.value.senha) {
    error.value = 'Todos os campos obrigatórios devem ser preenchidos'
    return false
  }

  if (formData.value.senha !== formData.value.confirmar_senha) {
    error.value = 'As senhas não coincidem'
    return false
  }

  if (formData.value.senha.length < 6) {
    error.value = 'A senha deve ter pelo menos 6 caracteres'
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.value.email)) {
    error.value = 'Email do provedor inválido'
    return false
  }

  if (!emailRegex.test(formData.value.admin_email)) {
    error.value = 'Email do administrador inválido'
    return false
  }

  return true
}

const handleRegister = async () => {
  error.value = ''
  success.value = ''

  if (!validateForm()) {
    return
  }

  if (!selectedPlan.value) {
    error.value = 'Nenhum plano selecionado'
    return
  }

  loading.value = true

  try {
    // Chamar API de registro
    const response = await registerService.register({
      nome: formData.value.nome,
      razao_social: formData.value.razao_social || formData.value.nome,
      cnpj: formData.value.cnpj,
      dominio: formData.value.dominio,
      email: formData.value.email,
      telefone: formData.value.telefone,
      admin_nome: formData.value.admin_nome,
      admin_email: formData.value.admin_email,
      senha: formData.value.senha,
      plan_slug: selectedPlan.value.slug
    })

    if (response.success) {
      // Armazenar dados de registro
      registrationData.value = {
        user_id: response.user_id,
        tenant_id: response.tenant_id,
        subscription_id: response.subscription_id
      }

      success.value = 'Cadastro realizado com sucesso! Prosseguindo para pagamento...'
      
      // Aguardar 1.5 segundos e ir para pagamento
      setTimeout(() => {
        currentStep.value = 'payment'
        error.value = ''
        success.value = ''
      }, 1500)
    } else {
      error.value = response.message || 'Erro ao realizar cadastro'
    }
  } catch (err: any) {
    error.value = err.message || 'Erro ao realizar cadastro. Tente novamente.'
  } finally {
    loading.value = false
  }
}

const handlePayment = async () => {
  error.value = ''
  
  if (!selectedPlan.value) return

  loading.value = true

  try {
    // TODO: Integrar com EFI para gerar cobrança
    // Por enquanto, simular sucesso
    await new Promise(resolve => setTimeout(resolve, 2000))

    success.value = 'Pagamento processado! Redirecionando para o portal...'
    
    // Limpar dados
    localStorage.removeItem('selected_plan')
    
    // Redirecionar para login/portal
    setTimeout(() => {
      router.push({ name: 'portal-login' })
    }, 2000)
  } catch (err: any) {
    error.value = err.message || 'Erro ao processar pagamento'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSelectedPlan()
})
</script>

<template>
  <div class="portal-register">
    <div class="register-container">
      <div class="register-card">
        <!-- Header com Steps -->
        <div class="steps-indicator">
          <div class="step" :class="{ active: currentStep === 'register', completed: currentStep === 'payment' }">
            <div class="step-number">1</div>
            <div class="step-label">Cadastro</div>
          </div>
          <div class="step-divider"></div>
          <div class="step" :class="{ active: currentStep === 'payment' }">
            <div class="step-number">2</div>
            <div class="step-label">Pagamento</div>
          </div>
        </div>

        <h1 v-if="currentStep === 'register'">📝 Criar Conta</h1>
        <h1 v-else>💳 Pagamento</h1>
        
        <p v-if="currentStep === 'register'" class="subtitle">Preencha seus dados para começar</p>
        <p v-else class="subtitle">Complete seu pagamento para ativar sua assinatura</p>

        <!-- Plano Selecionado -->
        <div v-if="selectedPlan" class="plan-selected">
          <div class="plan-badge">
            <strong>Plano:</strong> {{ selectedPlan.nome }}
          </div>
          <div class="plan-price">
            R$ {{ selectedPlan.valor_mensal.toFixed(2) }}/{{ selectedPlan.periodo }}
          </div>
          <div v-if="selectedPlan.dias_trial > 0 && currentStep === 'register'" class="plan-trial">
            🎁 {{ selectedPlan.dias_trial }} dias de teste grátis
          </div>
        </div>

        <!-- Mensagens -->
        <div v-if="error" class="message message-error">{{ error }}</div>
        <div v-if="success" class="message message-success">{{ success }}</div>

        <!-- STEP 1: Formulário de Cadastro -->
        <form v-if="currentStep === 'register'" @submit.prevent="handleRegister" class="register-form">
          <h3 class="form-section-title">📋 Dados do Provedor</h3>
          
          <div class="form-group">
            <label for="nome">Nome do Provedor *</label>
            <input
              id="nome"
              v-model="formData.nome"
              type="text"
              placeholder="Nome fantasia da sua empresa"
              class="input-field"
              :disabled="loading"
              required
            />
          </div>

          <div class="form-group">
            <label for="razao_social">Razão Social</label>
            <input
              id="razao_social"
              v-model="formData.razao_social"
              type="text"
              placeholder="Razão social (opcional)"
              class="input-field"
              :disabled="loading"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="cnpj">CNPJ *</label>
              <input
                id="cnpj"
                v-model="formData.cnpj"
                type="text"
                placeholder="00.000.000/0000-00"
                class="input-field"
                :disabled="loading"
                @input="handleCpfCnpjInput"
                maxlength="18"
                required
              />
            </div>

            <div class="form-group">
              <label for="dominio">Domínio</label>
              <input
                id="dominio"
                v-model="formData.dominio"
                type="text"
                placeholder="seuprovedor.com.br"
                class="input-field"
                :disabled="loading"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="email">Email do Provedor *</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                placeholder="contato@seuprovedor.com.br"
                class="input-field"
                :disabled="loading"
                required
              />
            </div>

            <div class="form-group">
              <label for="telefone">Telefone *</label>
              <input
                id="telefone"
                v-model="formData.telefone"
                type="text"
                placeholder="(00) 00000-0000"
                class="input-field"
                :disabled="loading"
                @input="handlePhoneInput"
                maxlength="15"
                required
              />
            </div>
          </div>

          <div class="form-divider"></div>

          <h3 class="form-section-title">👤 Dados do Administrador</h3>

          <div class="form-group">
            <label for="admin_nome">Nome do Administrador *</label>
            <input
              id="admin_nome"
              v-model="formData.admin_nome"
              type="text"
              placeholder="Seu nome completo"
              class="input-field"
              :disabled="loading"
              required
            />
          </div>

          <div class="form-group">
            <label for="admin_email">Email do Administrador *</label>
            <input
              id="admin_email"
              v-model="formData.admin_email"
              type="email"
              placeholder="seu@email.com"
              class="input-field"
              :disabled="loading"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="senha">Senha *</label>
              <input
                id="senha"
                v-model="formData.senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                class="input-field"
                :disabled="loading"
                required
              />
            </div>

            <div class="form-group">
              <label for="confirmar_senha">Confirmar Senha *</label>
              <input
                id="confirmar_senha"
                v-model="formData.confirmar_senha"
                type="password"
                placeholder="Repita a senha"
                class="input-field"
                :disabled="loading"
                required
              />
            </div>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="!loading">{{ buttonText }}</span>
            <span v-else>Processando...</span>
          </button>

          <div class="login-link">
            Já tem uma conta? 
            <router-link :to="{ name: 'portal-login' }">Fazer login</router-link>
          </div>
        </form>

        <!-- STEP 2: Pagamento -->
        <div v-if="currentStep === 'payment'" class="payment-section">
          <div class="payment-summary">
            <h3>Resumo da Compra</h3>
            <div class="summary-item">
              <span>Plano:</span>
              <strong>{{ selectedPlan?.nome }}</strong>
            </div>
            <div class="summary-item">
              <span>Período:</span>
              <strong>{{ selectedPlan?.periodo }}</strong>
            </div>
            <div v-if="selectedPlan?.dias_trial && selectedPlan.dias_trial > 0" class="summary-item trial">
              <span>Trial:</span>
              <strong>{{ selectedPlan.dias_trial }} dias grátis</strong>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item total">
              <span>Total:</span>
              <strong>R$ {{ selectedPlan?.valor_mensal.toFixed(2) }}</strong>
            </div>
          </div>

          <div class="payment-methods">
            <h3>Forma de Pagamento</h3>
            <p class="payment-info">
              Você será redirecionado para completar o pagamento de forma segura através da EFI (Gerencianet).
            </p>
            
            <div class="payment-badges">
              <div class="badge">💳 Cartão de Crédito</div>
              <div class="badge">📱 Pix</div>
              <div class="badge">📄 Boleto</div>
            </div>
          </div>

          <button @click="handlePayment" class="btn btn-primary" :disabled="loading">
            <span v-if="!loading">💳 Ir para Pagamento</span>
            <span v-else>Processando...</span>
          </button>

          <button @click="currentStep = 'register'" class="btn btn-outline" :disabled="loading">
            ← Voltar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portal-register {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.register-container {
  width: 100%;
  max-width: 600px;
}

.register-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

/* Steps Indicator */
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #f3f4f6;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.4;
  transition: opacity 0.3s;
}

.step.active,
.step.completed {
  opacity: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.3s;
}

.step.active .step-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.step.completed .step-number {
  background: #10b981;
  color: white;
}

.step-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.step.active .step-label {
  color: #667eea;
  font-weight: 600;
}

.step-divider {
  width: 80px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 1rem;
}

@media (max-width: 768px) {
  .portal-register {
    padding: 1.25rem;
  }

  .register-card {
    padding: 1.5rem;
  }

  .steps-indicator {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .step-divider {
    width: 48px;
  }
}

h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  color: #1f2937;
  text-align: center;
}

.subtitle {
  margin: 0 0 2rem;
  color: #6b7280;
  text-align: center;
  font-size: 1rem;
}

/* Plano Selecionado */
.plan-selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
}

.plan-badge {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.plan-price {
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.plan-trial {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Mensagens */
.message {
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  text-align: center;
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

/* Formulário */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section-title {
  margin: 1rem 0 0.5rem;
  font-size: 1.1rem;
  color: #1f2937;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
  margin: 1rem 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
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
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-field:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  color: #6b7280;
  font-size: 0.95rem;
  margin-top: 1rem;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

/* Payment Section */
.payment-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.payment-summary {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.payment-summary h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #1f2937;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.summary-item.trial {
  color: #059669;
}

.summary-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0.5rem 0;
}

.summary-item.total {
  font-size: 1.25rem;
  color: #1f2937;
  font-weight: 600;
  padding-top: 1rem;
}

.payment-methods {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.payment-methods h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #1f2937;
}

.payment-info {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.payment-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.badge {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
}

.btn-outline {
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
}

.btn-outline:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

@media (max-width: 640px) {
  .register-card {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
