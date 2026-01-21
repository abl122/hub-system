<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { tenantsService } from '@/services/tenantsService'
import { plansService } from '@/services/plansService'
import InfoItem from '@/components/portal/InfoItem.vue'

const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const tenant = ref<any>(null)
const availablePlans = ref<any[]>([])

const currentPlan = computed(() => {
  if (!tenant.value?.assinatura?.plano_id || !availablePlans.value.length) return null
  return availablePlans.value.find(p => p._id === tenant.value.assinatura.plano_id)
})

const daysRemaining = computed(() => {
  if (!tenant.value?.assinatura?.data_fim) return 0
  const today = new Date()
  const endDate = new Date(tenant.value.assinatura.data_fim)
  const diff = endDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const isExpired = computed(() => daysRemaining.value <= 0)
const isExpiringSoon = computed(() => daysRemaining.value > 0 && daysRemaining.value <= 7)

const subscriptionStatus = computed(() => {
  if (tenant.value?.assinatura?.ativa) {
    if (isExpired.value) return { label: '❌ Expirada', color: '#dc2626' }
    if (isExpiringSoon.value) return { label: '⚠️ Vencendo', color: '#f59e0b' }
    return { label: '✅ Ativa', color: '#10b981' }
  }
  return { label: '⏸️ Inativa', color: '#6b7280' }
})

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    const tenantId = localStorage.getItem('tenantId')
    if (!tenantId || !authStore.portalToken) {
      error.value = 'Não autenticado'
      return
    }

    // Carregar dados do tenant
    const tenantResponse = await tenantsService.getTenant(tenantId, authStore.portalToken)
    if (tenantResponse.success) {
      tenant.value = tenantResponse.tenant
    } else {
      throw new Error(tenantResponse.message)
    }

    // Carregar planos disponíveis
    const plansResponse = await plansService.listPlans(authStore.portalToken, tenantId, true)
    if (plansResponse.success) {
      availablePlans.value = plansResponse.plans
    }
  } catch (err: any) {
    error.value = err.message || 'Erro ao carregar dados'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleUpgradePlan = () => {
  // Navegar para página de upgrade
  console.log('Upgrade plan')
}

const handleRenew = () => {
  // Navegar para página de renovação
  console.log('Renew subscription')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="portal-provider">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>🏢 Provedor e Assinatura</h1>
        <p class="subtitle">Informações do seu provedor e status de assinatura</p>
      </div>
      <div v-if="subscriptionStatus" class="status-badge" :style="{ color: subscriptionStatus.color }">
        {{ subscriptionStatus.label }}
      </div>
    </div>

    <div v-if="error" class="error-message">
      <strong>❌ Erro:</strong> {{ error }}
    </div>

    <div v-if="loading" class="loading">Carregando informações...</div>

    <div v-if="!loading && tenant" class="content">
      <!-- Alerta de Expiração -->
      <div v-if="isExpiringSoon && !isExpired" class="warning-alert">
        <span class="alert-icon">⚠️</span>
        <div class="alert-content">
          <strong>Assinatura expirando!</strong>
          <p>Sua assinatura expira em {{ daysRemaining }} dias. Renove agora para evitar interrupções.</p>
          <button class="btn-renew" @click="handleRenew">Renovar Agora</button>
        </div>
      </div>

      <div v-if="isExpired" class="danger-alert">
        <span class="alert-icon">🚨</span>
        <div class="alert-content">
          <strong>Assinatura expirada!</strong>
          <p>Sua assinatura expirou. Renove para restaurar o acesso ao sistema.</p>
          <button class="btn-renew" @click="handleRenew">Renovar Agora</button>
        </div>
      </div>

      <!-- Seção: Informações do Provedor -->
      <section class="section">
        <h2>📋 Informações do Provedor</h2>
        <div class="info-grid">
          <InfoItem
            label="Razão Social"
            :value="tenant.provedor?.nome || '-'"
            icon="🏢"
            highlight
          />
          <InfoItem
            label="CNPJ"
            :value="tenant.provedor?.cnpj || '-'"
            icon="🔢"
          />
          <InfoItem
            label="Email"
            :value="tenant.assinatura?.email || tenant.provedor?.email || '-'"
            icon="📧"
          />
          <InfoItem
            label="Telefone"
            :value="tenant.assinatura?.telefone || tenant.provedor?.telefone || '-'"
            icon="📱"
          />
        </div>
      </section>

      <!-- Seção: Assinatura e Plano -->
      <section class="section">
        <h2>💳 Assinatura e Plano</h2>
        <div class="subscription-grid">
          <div class="subscription-card">
            <h3>Plano Atual</h3>
            <div class="plan-name">{{ currentPlan?.nome || '-' }}</div>
            <div class="plan-price">
              {{ currentPlan?.valor_mensal ? 'R$ ' + currentPlan.valor_mensal.toFixed(2) : '-' }}
              <span v-if="currentPlan?.periodo === 'mensal'" class="period">/mês</span>
            </div>
          </div>

          <div class="subscription-card">
            <h3>Status</h3>
            <div class="status-display">
              <span :style="{ color: subscriptionStatus.color }">
                {{ subscriptionStatus.label }}
              </span>
            </div>
            <div class="status-detail">
              {{ tenant.assinatura?.ativa ? 'Assinatura ativa' : 'Assinatura inativa' }}
            </div>
          </div>

          <div class="subscription-card">
            <h3>Validade</h3>
            <div v-if="!isExpired" class="days-remaining">
              <span class="number">{{ daysRemaining }}</span>
              <span class="label">dias restantes</span>
            </div>
            <div v-else class="expired">
              <span>Expirada</span>
            </div>
          </div>

          <div class="subscription-card">
            <h3>Data de Início</h3>
            <div class="date-info">
              {{
                tenant.assinatura?.data_inicio
                  ? new Date(tenant.assinatura.data_inicio).toLocaleDateString('pt-BR')
                  : '-'
              }}
            </div>
          </div>

          <div class="subscription-card">
            <h3>Data de Término</h3>
            <div class="date-info">
              {{
                tenant.assinatura?.data_fim
                  ? new Date(tenant.assinatura.data_fim).toLocaleDateString('pt-BR')
                  : '-'
              }}
            </div>
          </div>

          <div class="subscription-card">
            <h3>Valor Mensal</h3>
            <div class="price-info">
              R$ {{ tenant.assinatura?.valor_mensal?.toFixed(2) || '0,00' }}
            </div>
          </div>
        </div>
      </section>

      <!-- Botões de Ação -->
      <div class="action-buttons">
        <button v-if="!isExpired" class="btn btn-secondary" @click="handleUpgradePlan">
          ⬆️ Mudar Plano
        </button>
        <button class="btn btn-primary" @click="handleRenew">
          🔄 Renovar Assinatura
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portal-provider {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.status-badge {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1rem;
}

.error-message {
  background: #fee2e2;
  border-left: 4px solid #dc2626;
  padding: 1rem;
  border-radius: 6px;
  color: #991b1b;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.warning-alert {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.danger-alert {
  background: #fef2f2;
  border-left: 4px solid #dc2626;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-content {
  flex: 1;
}

.alert-content p {
  margin: 0.5rem 0 0;
  color: #6b7280;
}

.btn-renew {
  margin-top: 0.5rem;
  padding: 0.6rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}

.btn-renew:hover {
  background: #d97706;
}

.section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.section h2 {
  margin: 0 0 1.5rem;
  font-size: 1.3rem;
  color: #1f2937;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0.75rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.subscription-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.subscription-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.subscription-card h3 {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.plan-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1f2937;
}

.plan-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
  margin-top: 0.5rem;
}

.period {
  font-size: 0.9rem;
  font-weight: 400;
}

.status-display {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.status-detail {
  font-size: 0.85rem;
  color: #6b7280;
}

.days-remaining {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.number {
  font-size: 1.8rem;
  font-weight: 700;
  color: #10b981;
}

.label {
  font-size: 0.85rem;
  color: #6b7280;
}

.expired {
  font-size: 1.3rem;
  font-weight: 600;
  color: #dc2626;
}

.date-info {
  font-size: 1.1rem;
  color: #1f2937;
  font-weight: 500;
}

.price-info {
  font-size: 1.4rem;
  font-weight: 700;
  color: #059669;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: white;
  color: #3b82f6;
  border: 2px solid #3b82f6;
}

.btn-secondary:hover {
  background: #eff6ff;
}

@media (max-width: 768px) {
  .portal-provider {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
  }

  .action-buttons {
    flex-direction: column;
  }

  .info-grid,
  .subscription-grid {
    grid-template-columns: 1fr;
  }
}
</style>
