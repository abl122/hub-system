<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tenantsService } from '@/services/tenantsService'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const tenant = ref<any>(null)

const currentPlan = computed(() => {
  if (!tenant.value?.assinatura?.plano_nome) return null
  return {
    nome: tenant.value.assinatura.plano_nome,
    valor: tenant.value.assinatura.valor_mensal,
    ativa: tenant.value.assinatura.ativa
  }
})

const daysRemaining = computed(() => {
  if (!tenant.value?.assinatura?.data_fim) return 0
  const today = new Date()
  const endDate = new Date(tenant.value.assinatura.data_fim)
  const diff = endDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const isExpiringSoon = computed(() => daysRemaining.value > 0 && daysRemaining.value <= 7)

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    const tenantId = localStorage.getItem('tenantId')
    if (!authStore.portalToken || !tenantId) {
      error.value = 'Não autenticado'
      return
    }

    const response = await tenantsService.getTenant(tenantId, authStore.portalToken)
    if (response.success) {
      tenant.value = response.tenant
    } else {
      error.value = response.message || 'Erro ao carregar dados'
    }
  } catch (err) {
    error.value = 'Erro ao carregar dados'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="portal-dashboard">
    <div class="welcome-section">
      <div class="welcome-content">
        <h1>👋 Bem-vindo ao MK-Edge!</h1>
        <p>{{ tenant?.provedor?.nome || 'Provedor' }}</p>
      </div>
      <div v-if="currentPlan" class="plan-badge">
        <span class="badge-label">Plano Atual</span>
        <span class="badge-value">{{ currentPlan.nome }}</span>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="loading" class="loading">Carregando...</div>

    <div v-if="!loading && tenant" class="content">
      <!-- Card Principal: Status da Assinatura -->
      <div class="main-card">
        <div class="card-header">
          <div>
            <h2>{{ currentPlan?.nome || 'Sem plano' }}</h2>
            <p class="card-subtitle">R$ {{ currentPlan?.valor?.toFixed(2) || '0.00' }} /mês</p>
          </div>
          <span 
            class="status-badge"
            :class="currentPlan?.ativa ? 'badge-active' : 'badge-inactive'"
          >
            {{ currentPlan?.ativa ? '✓ Ativa' : '✗ Inativa' }}
          </span>
        </div>
        <div class="card-body">
          <div class="detail-row">
            <span>Dias restantes:</span>
            <strong>{{ daysRemaining }}</strong>
          </div>
          <div class="detail-row">
            <span>Próxima renovação:</span>
            <strong>{{ new Date(tenant?.assinatura?.data_fim).toLocaleDateString('pt-BR') }}</strong>
          </div>
        </div>
        <button @click="router.push('/portal/subscription')" class="btn-primary-action">
          Gerenciar Assinatura →
        </button>
      </div>

      <!-- Status da Assinatura -->
      <div class="status-alert" v-if="isExpiringSoon">
        <span class="alert-icon">⚠️</span>
        <div class="alert-content">
          <strong>Atenção!</strong>
          <p>Sua assinatura expira em {{ daysRemaining }} dias. Renove para continuar usando o sistema.</p>
        </div>
      </div>

      <!-- Ações Rápidas -->
      <div class="quick-access">
        <h2>Próximas Ações</h2>
        <div class="actions-grid">
          <button @click="router.push('/portal/install')" class="action-card">
            <span class="action-icon">📥</span>
            <h3>Instalar Agente</h3>
            <p>Configure seu servidor</p>
          </button>

          <button @click="router.push('/portal/subscription')" class="action-card">
            <span class="action-icon">💳</span>
            <h3>Gerenciar Assinatura</h3>
            <p>Planos e renovação</p>
          </button>

          <button @click="router.push('/portal/payments')" class="action-card">
            <span class="action-icon">📋</span>
            <h3>Faturas</h3>
            <p>Histórico de pagamentos</p>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portal-dashboard {
  width: 100%;
}

.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.welcome-content h1 {
  font-size: 1.75rem;
  margin: 0;
  font-weight: 700;
}

.welcome-content p {
  font-size: 1rem;
  opacity: 0.95;
  margin: 0.25rem 0 0 0;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #dc2626;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #667eea;
  font-weight: 600;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.main-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-top: 4px solid #667eea;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

@media (max-width: 768px) {
  .portal-dashboard {
    padding: 1.25rem 0;
  }

  .portal-dashboard > * {
    padding: 0 16px;
  }

  .welcome-section {
    padding: 1.25rem;
    flex-direction: column;
    align-items: flex-start;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-body {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.card-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #999;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
}

.badge-active {
  background: #d1fae5;
  color: #065f46;
}

.badge-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.card-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-row span {
  color: #666;
  font-size: 0.875rem;
}

.detail-row strong {
  color: #333;
  font-size: 1.125rem;
}

.btn-primary-action {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  align-self: flex-start;
}

.btn-primary-action:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.quick-access {
  margin-top: 1rem;
}

.quick-access h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: #333;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.action-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.action-card h3 {
  margin: 0;
  font-size: 1rem;
  color: #333;
  font-weight: 700;
}

.action-card p {
  margin: 0;
  font-size: 0.75rem;
  color: #666;
}

@media (max-width: 768px) {
  .portal-dashboard {
    padding: 1rem;
  }

  .welcome-section {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.5rem;
  }

  .card-header {
    flex-direction: column;
  }

  .card-body {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
