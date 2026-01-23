<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { tenantsService } from '@/services/tenantsService'
import { plansService } from '@/services/plansService'

const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const success = ref('')
const tenant = ref<any>(null)
const availablePlans = ref<any[]>([])
const showCancelModal = ref(false)
const showUpgradeModal = ref(false)
const selectedPlanId = ref('')

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
    }

    // Carregar planos disponíveis
    const plansResponse = await plansService.listPlans(authStore.portalToken, tenantId, true)
    if (plansResponse.success) {
      availablePlans.value = plansResponse.plans
    }

  } catch (err: any) {
    error.value = err.message || 'Erro ao carregar dados'
  } finally {
    loading.value = false
  }
}

const handleCancelSubscription = async () => {
  if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá acesso ao final do período atual.')) {
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const tenantId = localStorage.getItem('tenantId')
    if (!tenantId || !authStore.portalToken) return

    const updateData = {
      assinatura: {
        ...tenant.value.assinatura,
        ativa: false,
        cancelada_em: new Date().toISOString()
      }
    }

    const response = await tenantsService.updateTenant(tenantId, updateData, authStore.portalToken)
    
    if (response.success) {
      success.value = 'Assinatura cancelada com sucesso. Você manterá acesso até ' + 
        new Date(tenant.value.assinatura.data_fim).toLocaleDateString('pt-BR')
      showCancelModal.value = false
      await loadData()
    } else {
      error.value = response.message || 'Erro ao cancelar assinatura'
    }
  } catch (err: any) {
    error.value = err.message || 'Erro ao cancelar assinatura'
  } finally {
    loading.value = false
  }
}

const handleChangePlan = async () => {
  if (!selectedPlanId.value) {
    error.value = 'Selecione um plano'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const tenantId = localStorage.getItem('tenantId')
    if (!tenantId || !authStore.portalToken) return

    const newPlan = availablePlans.value.find(p => p._id === selectedPlanId.value)
    if (!newPlan) return

    const updateData = {
      assinatura: {
        ...tenant.value.assinatura,
        plano_id: newPlan._id,
        plano_nome: newPlan.nome,
        valor_mensal: newPlan.valor_mensal,
        atualizado_em: new Date().toISOString()
      }
    }

    const response = await tenantsService.updateTenant(tenantId, updateData, authStore.portalToken)
    
    if (response.success) {
      success.value = 'Plano atualizado com sucesso!'
      showUpgradeModal.value = false
      selectedPlanId.value = ''
      await loadData()
    } else {
      error.value = response.message || 'Erro ao atualizar plano'
    }
  } catch (err: any) {
    error.value = err.message || 'Erro ao atualizar plano'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="subscription-page">
    <div class="page-header">
      <h1>Minha Assinatura</h1>
      <p>Gerencie seu plano e assinatura</p>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="!loading && tenant" class="subscription-content">
      <!-- Status da Assinatura -->
      <div class="status-card">
        <div class="status-header">
          <h2>Sua Assinatura</h2>
          <span 
            class="status-badge" 
            :class="{
              'status-active': tenant.assinatura?.ativa && !isExpired,
              'status-expiring': isExpiringSoon,
              'status-expired': isExpired,
              'status-cancelled': !tenant.assinatura?.ativa
            }"
          >
            {{ tenant.assinatura?.ativa && !isExpired ? '✓ Ativa' : 
               isExpired ? '✗ Expirada' : 
               !tenant.assinatura?.ativa ? '✗ Cancelada' : '✓ Ativa' }}
          </span>
        </div>

        <div class="status-details">
          <div class="detail-row">
            <span>Plano:</span>
            <strong>{{ tenant.assinatura?.plano_nome || currentPlan?.nome || 'N/A' }}</strong>
          </div>
          <div class="detail-row">
            <span>Valor Mensal:</span>
            <strong>R$ {{ tenant.assinatura?.valor_mensal?.toFixed(2) || '0.00' }}</strong>
          </div>
          <div class="detail-row">
            <span>Dias Restantes:</span>
            <strong :class="{ 'text-danger': isExpiringSoon || isExpired }">
              {{ daysRemaining > 0 ? daysRemaining : 0 }}
            </strong>
          </div>
          <div class="detail-row">
            <span>Próxima Renovação:</span>
            <strong>{{ new Date(tenant.assinatura?.data_fim).toLocaleDateString('pt-BR') }}</strong>
          </div>
        </div>

        <div v-if="isExpiringSoon && !isExpired" class="alert alert-warning">
          ⚠️ Sua assinatura expira em {{ daysRemaining }} dias.
        </div>

        <div v-if="isExpired" class="alert alert-error">
          ❌ Sua assinatura expirou.
        </div>

        <!-- Ações -->
        <div class="action-buttons">
          <button 
            @click="showUpgradeModal = true" 
            class="btn btn-primary"
            :disabled="!tenant.assinatura?.ativa"
          >
            🔄 Alterar Plano
          </button>
          
          <button 
            @click="showCancelModal = true" 
            class="btn btn-danger"
            :disabled="!tenant.assinatura?.ativa"
          >
            ❌ Cancelar Assinatura
          </button>
        </div>
      </div>

      <!-- Plano Atual -->
      <div class="current-plan-card" v-if="currentPlan">
        <h2>Detalhes do Plano</h2>
        <div class="plan-info">
          <div class="plan-header">
            <h3>{{ currentPlan.nome }}</h3>
            <span class="plan-price">R$ {{ currentPlan.valor_mensal?.toFixed(2) }}/{{ currentPlan.periodo }}</span>
          </div>
          <p class="plan-description">{{ currentPlan.descricao }}</p>
          
          <div class="plan-features">
            <h4>Recursos Inclusos:</h4>
            <ul>
              <li v-for="recurso in currentPlan.recursos" :key="recurso">
                ✓ {{ recurso }}
              </li>
            </ul>
          </div>

          <div class="plan-limits">
            <div class="limit-item">
              <span class="label">Limite de Clientes:</span>
              <span class="value">{{ currentPlan.limite_clientes || 'Ilimitado' }}</span>
            </div>
            <div class="limit-item" v-if="currentPlan.dias_trial > 0">
              <span class="label">Período Trial:</span>
              <span class="value">{{ currentPlan.dias_trial }} dias</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Cancelar -->
    <div v-if="showCancelModal" class="modal-overlay" @click="showCancelModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Cancelar Assinatura</h3>
          <button @click="showCancelModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja cancelar sua assinatura?</p>
          <ul class="warning-list">
            <li>Você perderá acesso ao sistema ao final do período atual</li>
            <li>Data de término: <strong>{{ new Date(tenant?.assinatura?.data_fim).toLocaleDateString('pt-BR') }}</strong></li>
            <li>Todos os seus dados serão mantidos por 30 dias</li>
            <li>Você poderá reativar a assinatura dentro deste período</li>
          </ul>
        </div>
        <div class="modal-footer">
          <button @click="showCancelModal = false" class="btn btn-secondary">Voltar</button>
          <button @click="handleCancelSubscription" class="btn btn-danger" :disabled="loading">
            {{ loading ? 'Cancelando...' : 'Confirmar Cancelamento' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Alterar Plano -->
    <div v-if="showUpgradeModal" class="modal-overlay" @click="showUpgradeModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Alterar Plano</h3>
          <button @click="showUpgradeModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>Selecione o novo plano:</p>
          <div class="plans-grid">
            <div 
              v-for="plan in availablePlans" 
              :key="plan._id"
              class="plan-option"
              :class="{ 
                'selected': selectedPlanId === plan._id,
                'current': plan._id === currentPlan?._id
              }"
              @click="selectedPlanId = plan._id"
            >
              <h4>{{ plan.nome }}</h4>
              <p class="price">R$ {{ plan.valor_mensal?.toFixed(2) }}/{{ plan.periodo }}</p>
              <span v-if="plan._id === currentPlan?._id" class="current-badge">Plano Atual</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showUpgradeModal = false" class="btn btn-secondary">Cancelar</button>
          <button 
            @click="handleChangePlan" 
            class="btn btn-primary" 
            :disabled="loading || !selectedPlanId || selectedPlanId === currentPlan?._id"
          >
            {{ loading ? 'Alterando...' : 'Confirmar Alteração' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.subscription-page {
  width: 100%;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.page-header p {
  color: #666;
  margin: 0;
}

.subscription-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.status-card,
.current-plan-card,
.actions-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.status-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-expiring {
  background: #fef3c7;
  color: #92400e;
}

.status-expired,
.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item .label {
  font-size: 0.875rem;
  color: #666;
}

.detail-item .value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
}

.text-danger {
  color: #dc2626 !important;
}

.current-plan-card h2,
.actions-card h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: #333;
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.plan-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #667eea;
}

.plan-price {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
}

.plan-description {
  color: #666;
  line-height: 1.6;
}

.plan-features h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
  color: #333;
}

.plan-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.plan-features li {
  color: #059669;
  font-weight: 500;
}

.plan-limits {
  display: flex;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.limit-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e5e7eb;
}

@media (max-width: 768px) {
  .subscription-page {
    padding: 1.25rem;
  }

  .status-header,
  .plan-header,
  .action-buttons {
    flex-direction: column;
    align-items: flex-start;
  }

  .plan-limits {
    flex-direction: column;
    gap: 1rem;
  }
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.alert-warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
  margin-top: 1rem;
}

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
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
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
  font-size: 1.5rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.warning-list {
  list-style: none;
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  margin: 1rem 0;
}

.warning-list li {
  padding: 0.5rem 0;
  color: #92400e;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.plan-option {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  position: relative;
}

.plan-option:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.plan-option.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.plan-option.current {
  border-color: #059669;
  background: #d1fae5;
}

.plan-option h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.plan-option .price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #667eea;
  margin: 0;
}

.current-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #059669;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 768px) {
  .subscription-page {
    padding: 1rem;
  }

  .status-details {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .plan-limits {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
