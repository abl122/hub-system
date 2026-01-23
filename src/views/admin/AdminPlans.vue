<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { plansService, Plan } from '@/services/plansService'
import { tenantsService } from '@/services/tenantsService'
import PlanModal from '@/components/admin/PlanModal.vue'

const authStore = useAuthStore()
const plans = ref<Plan[]>([])
const loading = ref(false)
const error = ref('')
const tenantId = ref('')
const isModalOpen = ref(false)
const selectedPlan = ref<Plan | null>(null)

const loadTenantAndPlans = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!authStore.adminToken) {
      error.value = 'Não autenticado'
      return
    }

    // Admin busca TODOS os planos de TODOS os tenants
    const response = await plansService.listAllPlans(authStore.adminToken)

    if (response.success) {
      plans.value = response.plans.sort((a, b) => a.ordem - b.ordem)
      // Usar o tenant_id do primeiro plano se existir
      if (plans.value.length > 0) {
        tenantId.value = plans.value[0].tenant_id
      }
    } else {
      error.value = 'Erro ao carregar planos'
    }
  } catch (err) {
    error.value = 'Erro ao conectar ao servidor'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleOpenModal = (plan?: Plan) => {
  if (plan) {
    selectedPlan.value = plan
  } else {
    selectedPlan.value = null
  }
  isModalOpen.value = true
}

const handleCloseModal = () => {
  isModalOpen.value = false
  selectedPlan.value = null
}

const handleSavePlan = () => {
  loadTenantAndPlans()
}

const handleEdit = (planId: string) => {
  const plan = plans.value.find(p => p._id === planId)
  if (plan) {
    handleOpenModal(plan)
  }
}

const handleToggle = async (planId: string) => {
  try {
    if (!authStore.adminToken || !tenantId.value) {
      error.value = 'Não autenticado'
      return
    }

    await plansService.togglePlan(planId, authStore.adminToken, tenantId.value)
    loadTenantAndPlans()
  } catch (err) {
    error.value = 'Erro ao ativar/desativar plano'
    console.error(err)
  }
}

const handleDelete = async (planId: string) => {
  if (!confirm('Tem certeza que deseja deletar este plano? Esta ação não pode ser desfeita.'))
    return

  try {
    if (!authStore.adminToken || !tenantId.value) {
      error.value = 'Não autenticado'
      return
    }

    await plansService.deletePlan(planId, authStore.adminToken, tenantId.value)
    loadTenantAndPlans()
  } catch (err) {
    error.value = 'Erro ao deletar plano'
    console.error(err)
  }
}

onMounted(() => {
  loadTenantAndPlans()
})
</script>

<template>
  <div class="admin-plans">
    <PlanModal
      :isOpen="isModalOpen"
      :plan="selectedPlan"
      :adminToken="authStore.adminToken"
      :tenantId="tenantId"
      @close="handleCloseModal"
      @save="handleSavePlan"
    />

    <div class="page-header">
      <h2>Gerenciar Planos</h2>
      <button class="btn btn-primary" @click="handleOpenModal">+ Novo Plano</button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading" class="loading">Carregando planos...</div>

    <div v-else-if="plans.length === 0" class="empty-state">
      <p>Nenhum plano criado ainda. Crie o primeiro plano!</p>
    </div>

    <div v-else class="plans-grid">
      <div v-for="plan in plans" :key="plan._id" class="plan-card">
        <div class="plan-header">
          <h3>{{ plan.nome }}</h3>
          <span class="badge" :class="{ 'badge-active': plan.ativo }">
            {{ plan.ativo ? 'Ativo' : 'Inativo' }}
          </span>
        </div>

        <div v-if="plan.descricao" class="plan-description">
          {{ plan.descricao }}
        </div>

        <div class="plan-price">
          <span class="price"> R$ {{ plan.valor_mensal.toFixed(2) }} </span>
          <span class="period">por {{ plan.periodo }}</span>
        </div>

        <div class="plan-stats">
          <div class="stat">
            <span class="label">Limite de clientes</span>
            <span class="value">
              {{ plan.limite_clientes === null ? 'Ilimitado' : plan.limite_clientes }}
            </span>
          </div>
          <div v-if="plan.dias_trial" class="stat">
            <span class="label">Trial</span>
            <span class="value">{{ plan.dias_trial }} dias</span>
          </div>
        </div>

        <div v-if="plan.recursos && plan.recursos.length > 0" class="plan-features">
          <h4>Recursos</h4>
          <ul>
            <li v-for="(feature, idx) in plan.recursos.slice(0, 3)" :key="idx">
              ✓ {{ feature }}
            </li>
            <li v-if="plan.recursos.length > 3" class="more-features">
              + {{ plan.recursos.length - 3 }} mais
            </li>
          </ul>
        </div>

        <div class="plan-actions">
          <button class="btn-small btn-small-primary" @click="handleEdit(plan._id)">
            Editar
          </button>
          <button class="btn-small btn-small-secondary" @click="handleToggle(plan._id)">
            {{ plan.ativo ? 'Desativar' : 'Ativar' }}
          </button>
          <button class="btn-small btn-small-danger" @click="handleDelete(plan._id)">
            Deletar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.admin-plans {
  max-width: 100%;
}

.admin-plans h2 {
  margin: 0 0 2rem 0;
  color: var(--text-primary);
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  margin-top: 2rem;
  gap: 1.5rem;
}

.btn {
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: translateY(0);
}

/* ===== ERROR & LOADING ===== */
.error-message {
  background: var(--danger-light);
  color: var(--danger);
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 4px solid var(--danger);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideDown 0.3s ease;
}

.error-message::before {
  content: '✕';
  font-size: 1.25rem;
  flex-shrink: 0;
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

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--primary);
  font-weight: 600;
  font-size: 1.05rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-light);
  background: var(--bg-light);
  border-radius: 10px;
  border: 1px dashed var(--border);
  margin-bottom: 2rem;
}

.empty-state p {
  margin: 0;
  font-size: 1.05rem;
}

/* ===== PLANS GRID ===== */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

/* ===== PLAN CARD ===== */
.plan-card {
  background: var(--bg-white);
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 1.75rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.plan-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.plan-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.plan-card:hover::before {
  transform: scaleX(1);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.plan-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.375rem;
  font-weight: 700;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--danger-light);
  color: var(--danger);
  white-space: nowrap;
  flex-shrink: 0;
}

.badge::before {
  content: '●';
}

.badge-active {
  background: #dcfce7;
  color: var(--secondary);
}

.plan-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
  line-height: 1.5;
  min-height: 40px;
}

/* ===== PLAN PRICE ===== */
.plan-price {
  text-align: center;
  padding: 1.25rem;
  background: var(--primary-light);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.price {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -1px;
}

.period {
  display: block;
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-top: 0.5rem;
  font-weight: 500;
  text-transform: capitalize;
}

/* ===== PLAN STATS ===== */
.plan-stats {
  margin-bottom: 1.5rem;
}

.stat {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);
}

.stat:last-child {
  border-bottom: none;
}

.stat .label {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.stat .value {
  color: var(--primary);
  font-weight: 700;
  font-size: 0.95rem;
}

/* ===== PLAN FEATURES ===== */
.plan-features {
  flex: 1;
  margin-bottom: 1.5rem;
}

.plan-features h4 {
  margin: 0 0 0.875rem 0;
  font-size: 0.8rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
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
  padding: 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.plan-features li::before {
  content: '✓';
  color: var(--secondary);
  font-weight: 700;
  flex-shrink: 0;
}

.plan-features li.more-features {
  font-style: italic;
  color: var(--text-light);
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.plan-features li.more-features::before {
  content: '+';
  color: var(--warning);
}

/* ===== PLAN ACTIONS ===== */
.plan-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: auto;
}

.plan-actions .btn-small {
  grid-column: span 1;
}

.plan-actions .btn-small-primary {
  grid-column: span 2;
}

.btn-small {
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-small-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-small-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-small-secondary {
  background: var(--bg-light);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-small-secondary:hover {
  background: var(--border);
  border-color: var(--primary);
  color: var(--primary);
}

.btn-small-danger {
  background: var(--danger-light);
  color: var(--danger);
  border: 1px solid var(--danger-light);
}

.btn-small-danger:hover {
  background: var(--danger);
  color: white;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .plans-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .admin-plans h2 {
    font-size: 1.5rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .plan-card {
    padding: 1.25rem;
  }

  .price {
    font-size: 1.875rem;
  }

  .plan-actions {
    grid-template-columns: 1fr;
  }

  .plan-actions .btn-small-primary {
    grid-column: span 1;
  }
}

@media (max-width: 480px) {
  .admin-plans h2 {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .page-header {
    flex-direction: column;
  }

  .plan-card {
    padding: 1rem;
  }

  .price {
    font-size: 1.625rem;
  }

  .btn-small {
    font-size: 0.75rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>
