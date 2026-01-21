<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { plansService } from '@/services/plansService'
import { registerService } from '@/services/registerService'

const router = useRouter()

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
  limite_clientes: number
  recorrente: boolean
}

const plans = ref<Plan[]>([])
const loading = ref(false)
const error = ref('')
const tenantName = ref('MK-Edge')
const tenantColorPrimary = ref('#667eea')
const tenantColorSecondary = ref('#764ba2')
const showRegistration = ref(false)
const selectedPlan = ref<Plan | null>(null)
const registrationStep = ref<'form' | 'payment'>('form')

// Formulário
const formData = ref({
  nome: '',
  razao_social: '',
  cnpj: '',
  dominio: '',
  url_hotsite: '',
  telefone: '',
  admin_nome: '',
  admin_email: '',
  admin_telefone: '',
  senha: '',
  confirmar_senha: ''
})

const goToPortal = () => router.push({ name: 'portal-login' })
const goToAdmin = () => router.push({ name: 'admin-login' })

const selectPlan = (plan: Plan) => {
  selectedPlan.value = plan
  showRegistration.value = true
  registrationStep.value = 'form'
  error.value = ''
  // Scroll suave para o formulário
  setTimeout(() => {
    document.getElementById('registration-section')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }, 100)
}

const formatCnpj = (value: string) => {
  const numbers = value.replace(/\D/g, '')
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

const handleCnpjInput = () => {
  formData.value.cnpj = formatCnpj(formData.value.cnpj)
}

const handlePhoneInput = () => {
  formData.value.telefone = formatPhone(formData.value.telefone)
}

const handleAdminPhoneInput = () => {
  formData.value.admin_telefone = formatPhone(formData.value.admin_telefone)
}

const computeUrlAgente = (dominio: string) => {
  if (!dominio) return ''
  // Remove trailing slash if exists
  const base = dominio.endsWith('/') ? dominio.slice(0, -1) : dominio
  return `${base}/admin/addons/mk-edge/api.php`
}

const validateForm = () => {
  if (!formData.value.nome || !formData.value.cnpj || 
      !formData.value.telefone || !formData.value.admin_nome || 
      !formData.value.admin_email || !formData.value.admin_telefone || 
      !formData.value.senha) {
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
  if (!emailRegex.test(formData.value.admin_email)) {
    error.value = 'Email do administrador inválido'
    return false
  }

  return true
}

const handleRegister = async () => {
  error.value = ''

  if (!validateForm()) {
    return
  }

  if (!selectedPlan.value) {
    error.value = 'Nenhum plano selecionado'
    return
  }

  loading.value = true

  try {
    const response = await registerService.register({
      nome: formData.value.nome,
      razao_social: formData.value.razao_social || formData.value.nome,
      cnpj: formData.value.cnpj,
      dominio: formData.value.dominio,
      url_hotsite: computeUrlAgente(formData.value.dominio),
      email: formData.value.admin_email,
      telefone: formData.value.telefone,
      admin_nome: formData.value.admin_nome,
      admin_email: formData.value.admin_email,
      admin_telefone: formData.value.admin_telefone,
      senha: formData.value.senha,
      plan_slug: selectedPlan.value.slug
    })

    if (response.success) {
      error.value = ''
      registrationStep.value = 'payment'
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
  loading.value = true

  try {
    // TODO: Integrar com EFI
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    showRegistration.value = false
    router.push({ name: 'portal-login' })
  } catch (err: any) {
    error.value = err.message || 'Erro ao processar pagamento'
  } finally {
    loading.value = false
  }
}

const loadPublicPlans = async () => {
  loading.value = true
  error.value = ''

  try {
    // Obtém o domínio da URL ou usa o configurado no .env (VITE_TENANT_DOMAIN)
    const dominio = import.meta.env.VITE_TENANT_DOMAIN || 'provedor.updata.com.br'

    const response = await plansService.getPublicPlans(dominio)

    if (response.success) {
      plans.value = response.plans.sort((a, b) => {
        // Planos em destaque primeiro
        if (a.destaque !== b.destaque) {
          return a.destaque ? -1 : 1
        }
        return 0
      })

      tenantName.value = response.tenant_name
      tenantColorPrimary.value = response.tenant_color_primary
      tenantColorSecondary.value = response.tenant_color_secondary
    } else {
      error.value = 'Erro ao carregar planos'
    }
  } catch (err) {
    // Não mostrar erro na landing, usar valores padrão
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPublicPlans()
})
</script>

<template>
  <div class="landing-page">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="logo">
          <h1>{{ tenantName }}</h1>
        </div>
        <nav class="nav">
          <a href="#features" class="nav-link">Recursos</a>
          <a href="#pricing" class="nav-link">Preços</a>
          <button @click="goToPortal" class="btn btn-secondary">Portal</button>
          <button @click="goToAdmin" class="btn btn-primary">Admin</button>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h2>Bem-vindo ao Portal do Cliente do App MK-Edge!</h2>
        <p>Gerenciamento da sua conta e assinatura do aplicativo de Gestão Mk-Edge!</p>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="container">
        <h2>Recursos Principais</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="icon">👥</div>
            <h3>Gestão de Clientes</h3>
            <p>Gerencie todos os seus clientes com dados sincronizados com MK-Auth</p>
          </div>
          <div class="feature-card">
            <div class="icon">📡</div>
            <h3>Controle de Integrações</h3>
            <p>Configure e monitore integrações com suas ferramentas de rede</p>
          </div>
          <div class="feature-card">
            <div class="icon">📊</div>
            <h3>Relatórios Avançados</h3>
            <p>Gere relatórios detalhados sobre performance e receita</p>
          </div>
          <div class="feature-card">
            <div class="icon">🔐</div>
            <h3>Segurança em Primeiro Lugar</h3>
            <p>Autenticação integrada com MK-Auth e proteção de dados robusta</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="pricing">
      <div class="container">
        <h2>Planos de Preços</h2>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="loading" class="loading">Carregando planos...</div>

        <div v-else-if="plans.length === 0" class="no-plans">
          Nenhum plano disponível no momento
        </div>

        <div v-else class="pricing-grid">
          <div v-for="plan in plans" :key="plan._id" class="pricing-card" :class="{ featured: plan.destaque }">
            <div v-if="plan.destaque" class="featured-badge">Mais Popular</div>
            
            <h3>{{ plan.nome }}</h3>
            <p class="price">
              R$ {{ plan.valor_mensal.toFixed(2) }}<span>/{{ plan.periodo }}</span>
            </p>

            <div v-if="plan.dias_trial > 0" class="trial-badge">
              🎁 {{ plan.dias_trial }} dias grátis
            </div>

            <p class="description">{{ plan.descricao }}</p>

            <ul class="features-list">
              <li v-for="(recurso, idx) in plan.recursos" :key="idx">
                <span class="check-icon">✓</span> {{ recurso }}
              </li>
            </ul>

            <button 
              @click="selectPlan(plan)" 
              class="btn btn-primary"
            >
              {{ plan.recorrente ? '📝 Assinar' : '💎 Contratar' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Registration Modal (flutuante sobre landing) -->
    <section 
      v-if="showRegistration" 
      id="registration-section" 
      class="registration-section"
      @click.self="showRegistration = false"
    >
      <div class="registration-container">
        <div class="registration-header">
          <h2>📝 Complete seu Cadastro</h2>
          <button @click="showRegistration = false" class="close-btn">✕</button>
        </div>

        <div v-if="selectedPlan" class="plan-summary">
          <div class="plan-info">
            <strong>Plano Selecionado:</strong> {{ selectedPlan.nome }}
          </div>
          <div class="plan-value">
            R$ {{ selectedPlan.valor_mensal.toFixed(2) }}/{{ selectedPlan.periodo }}
          </div>
        </div>

        <div v-if="error" class="message message-error">{{ error }}</div>

        <div class="steps">
          <div :class="['step', registrationStep === 'form' ? 'active' : '', registrationStep === 'payment' ? 'done' : '']">
            <span class="step-number">1</span>
            <span class="step-label">Cadastro</span>
          </div>
          <div :class="['step', registrationStep === 'payment' ? 'active' : '']">
            <span class="step-number">2</span>
            <span class="step-label">Pagamento</span>
          </div>
        </div>

        <!-- STEP 1: Formulário -->
        <form v-if="registrationStep === 'form'" @submit.prevent="handleRegister" class="register-form">
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
                  @input="handleCnpjInput"
                  maxlength="18"
                  required
                />
              </div>

              <div class="form-group">
                <label for="dominio">URL do MK-Auth *</label>
                <input
                  id="dominio"
                  v-model="formData.dominio"
                  type="url"
                  placeholder="https://seu-hotsite.mk-auth.com"
                  class="input-field"
                  :disabled="loading"
                  required
                />
              </div>
            </div>

            <div class="form-row">
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

            <div class="form-row">
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

              <div class="form-group">
                <label for="admin_telefone">Celular do Administrador *</label>
                <input
                  id="admin_telefone"
                  v-model="formData.admin_telefone"
                  type="text"
                  placeholder="(00) 00000-0000"
                  class="input-field"
                  :disabled="loading"
                  @input="handleAdminPhoneInput"
                  maxlength="15"
                  required
                />
              </div>
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
              <span v-if="!loading">➜ Próximo</span>
              <span v-else>Processando...</span>
            </button>
          </form>

          <!-- STEP 2: Pagamento -->
          <div v-if="registrationStep === 'payment'" class="payment-section">
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

            <button @click="registrationStep = 'form'" class="btn btn-outline" :disabled="loading">
              ← Voltar
            </button>
          </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>&copy; 2026 {{ tenantName }}. Todos os direitos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.header {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 20px;
}

.logo h1 {
  font-size: 1.5rem;
  color: #667eea;
  margin: 0;
}

.nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #667eea;
}

/* Buttons */
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

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

.btn-outline {
  border: 2px solid white;
  color: white;
  background: transparent;
}

.btn-outline:hover {
  background: white;
  color: #667eea;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

/* Hero */
.hero {
  padding: 6rem 20px;
  color: white;
  text-align: center;
}

.hero h2 {
  font-size: 2.8rem;
  margin-bottom: 1rem;
  font-weight: 800;
  line-height: 1.2;
}

.hero p {
  font-size: 1.5rem;
  margin-bottom: 3rem;
  opacity: 0.95;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Features */
.features {
  padding: 5rem 20px;
  background: white;
}

.features h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 4rem;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  padding: 2rem;
  border-radius: 10px;
  background: #f8f9fa;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.feature-card .icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

/* Pricing */
.pricing {
  padding: 5rem 20px;
  background: #f5f5f5;
}

.pricing h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 4rem;
  color: #333;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 2rem;
  text-align: center;
  border-left: 4px solid #c62828;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #667eea;
  font-weight: 600;
}

.no-plans {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  align-items: stretch;
}

.pricing-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  border: 2px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pricing-card.featured {
  transform: scale(1.05);
  box-shadow: 0 20px 50px rgba(102, 126, 234, 0.3);
  border: 2px solid #667eea;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
}

.pricing-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.pricing-card.featured:hover {
  transform: scale(1.05) translateY(-5px);
}

.featured-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.4rem 1.2rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.pricing-card h3 {
  font-size: 1.75rem;
  margin-bottom: 1rem;
  color: #1f2937;
  font-weight: 700;
}

.pricing-card .price {
  font-size: 3rem;
  font-weight: 800;
  color: #667eea;
  margin-bottom: 1rem;
  line-height: 1;
}

.pricing-card .price span {
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 500;
}

.trial-badge {
  display: inline-block;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.description {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.features-list {
  list-style: none;
  margin: 0 0 2rem 0;
  text-align: left;
  flex-grow: 1;
}

.features-list li {
  padding: 0.75rem 0;
  color: #374151;
  line-height: 1.6;
  font-size: 0.95rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.check-icon {
  color: #10b981;
  font-weight: bold;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.pricing-card .btn {
  width: 100%;
  margin-top: 1.5rem;
}

/* Footer */
.footer {
  background: rgba(0, 0, 0, 0.1);
  color: white;
  padding: 2rem 20px;
  text-align: center;
}

/* Registration Section (Modal Flutuante) */
.registration-section {
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
  padding: 2rem;
  overflow-y: auto;
  animation: fadeIn 0.3s ease;
  backdrop-filter: blur(2px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.registration-container {
  max-width: 800px;
  width: 100%;
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 2px solid #e5e7eb;
  animation: slideUp 0.3s ease;
}

.steps {
  display: flex;
  gap: 0.75rem;
  margin: 1rem 0 1.5rem 0;
  justify-content: center;
}

.step {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 600;
  border: 1px solid #e0e7ff;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.08);
}

.step .step-number {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #4f46e5;
  border: 1px solid #e0e7ff;
}

.step.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.step.active .step-number {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border-color: rgba(255, 255, 255, 0.25);
}

.step.done {
  background: #ecfdf3;
  color: #047857;
  border-color: #a7f3d0;
}

.step.done .step-number {
  background: white;
  color: #047857;
  border-color: #a7f3d0;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.registration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
}

.registration-header h2 {
  margin: 0;
  font-size: 2rem;
  color: #1f2937;
}

.close-btn {
  background: transparent;
  color: #9ca3af;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
  transform: rotate(90deg);
}

.plan-summary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-info {
  font-size: 1rem;
}

.plan-value {
  font-size: 1.75rem;
  font-weight: bold;
}

.registration-notice {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 1.1rem;
}

.form-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
  margin: 1rem 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.message {
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

.message-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.register-form .btn-primary {
  align-self: flex-start;
  margin-top: 0.25rem;
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
  margin-top: 1rem;
}

.btn-outline:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .nav {
    gap: 1rem;
  }

  .hero h2 {
    font-size: 2rem;
  }

  .hero p {
    font-size: 1.1rem;
  }

  .nav-link {
    display: none;
  }

  .pricing-card.featured {
    transform: scale(1);
  }

  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .btn-lg {
    width: 100%;
  }

  .hero-buttons {
    flex-direction: column;
  }
}
</style>
