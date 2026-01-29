<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { tenantsService } from '@/services/tenantsService'
import { plansService } from '@/services/plansService'
import SubscriptionModal from '@/components/admin/SubscriptionModal.vue'

interface Tenant {
  _id: string
  provedor: {
    nome: string
    cnpj: string
    email: string
  }
  assinatura: {
    plano: string
    ativa: boolean
    valor_mensal?: number
    data_inicio?: string
    data_fim?: string
  }
}

interface AvailablePlan {
  _id: string
  nome: string
  slug: string
  valor: number
  periodo: string
}

const authStore = useAuthStore()
const tenants = ref<Tenant[]>([])
const allPlans = ref<AvailablePlan[]>([])
const loading = ref(false)
const error = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const isModalOpen = ref(false)
const selectedSubscription = ref<any>(null)

const loadTenants = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!authStore.adminToken) {
      error.value = 'Não autenticado'
      return
    }

    // Carregar planos primeiro
    const plansResponse = await plansService.listPlans(authStore.adminToken)
    if (plansResponse.success) {
      allPlans.value = plansResponse.plans || []
    }

    const response = await tenantsService.listTenants(authStore.adminToken, page.value, limit.value)

    if (response.success) {
      tenants.value = response.data || []
      total.value = response.pagination?.total || 0
    } else {
      error.value = 'Erro ao carregar provedores'
    }
  } catch (err) {
    error.value = 'Erro ao conectar ao servidor'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const openEditModal = (tenant: Tenant) => {
  selectedSubscription.value = {
    tenantId: tenant._id,
    tenantName: tenant.provedor.nome,
    cnpj: tenant.provedor.cnpj,
    assinatura: {
      plano: tenant.assinatura.plano,
      ativa: tenant.assinatura.ativa,
      valor_mensal: tenant.assinatura.valor_mensal || 0,
      data_inicio: tenant.assinatura.data_inicio || '',
      data_fim: tenant.assinatura.data_fim || ''
    }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedSubscription.value = null
}

const handleSaveSubscription = async () => {
  await loadTenants()
  closeModal()
}

const toggleSubscription = async (tenantId: string) => {
  try {
    if (!authStore.adminToken) {
      error.value = 'Não autenticado'
      return
    }

    const tenant = tenants.value.find(t => t._id === tenantId)
    if (!tenant) return

    await tenantsService.updateTenant(
      tenantId,
      {
        assinatura: {
          ...tenant.assinatura,
          ativa: !tenant.assinatura.ativa
        }
      },
      authStore.adminToken
    )

    loadTenants()
  } catch (err) {
    error.value = 'Erro ao atualizar assinatura'
    console.error(err)
  }
}

const getDaysRemaining = (dataFim: string) => {
  if (!dataFim) return 'Indeterminado'
  const fim = new Date(dataFim)
  const hoje = new Date()
  const diff = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? `${diff} dias` : 'Expirada'
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR')
}

const getPlanValue = (planoSlug: string): number => {
  const plan = allPlans.value.find(p => p.slug === planoSlug)
  return plan?.valor_mensal || 0
}

onMounted(() => {
  loadTenants()
})
</script>

<template>
  <div class="admin-subscriptions">
    <div class="page-header">
      <h2>Gerenciar Assinaturas</h2>
      <p class="subtitle">Controle os planos e assinaturas dos seus provedores</p>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="table-container">
      <div v-if="loading" class="loading">Carregando assinaturas...</div>

      <div v-else-if="tenants.length === 0" class="empty-state">
        <p>Nenhum provedor cadastrado</p>
      </div>

      <table v-else class="subscriptions-table">
        <thead>
          <tr>
            <th>Provedor</th>
            <th>Plano Atual</th>
            <th>Valor Mensal</th>
            <th>Início</th>
            <th>Término</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tenant in tenants" :key="tenant._id">
            <td class="provider-cell">
              <div class="provider-info">
                <strong>{{ tenant.provedor.nome }}</strong>
                <small>{{ tenant.provedor.cnpj }}</small>
              </div>
            </td>

            <td>
              <span class="badge badge-plan">{{ tenant.assinatura.plano }}</span>
            </td>

            <td>
              R$ {{ getPlanValue(tenant.assinatura.plano).toFixed(2) }}
            </td>

            <td>
              {{ formatDate(tenant.assinatura.data_inicio) }}
            </td>

            <td>
              <span :class="getDaysRemaining(tenant.assinatura.data_fim) === 'Expirada' ? 'expired' : ''">
                {{ formatDate(tenant.assinatura.data_fim) }}
              </span>
              <small class="remaining">{{ getDaysRemaining(tenant.assinatura.data_fim) }}</small>
            </td>

            <td>
              <span class="badge" :class="{ 'badge-active': tenant.assinatura.ativa }">
                {{ tenant.assinatura.ativa ? 'Ativa' : 'Inativa' }}
              </span>
            </td>

            <td class="actions">
              <div class="normal-actions">
                <button class="btn-icon btn-icon-edit" @click="openEditModal(tenant)" title="Editar">
                  ✏️
                </button>
                <button
                  class="btn-icon btn-icon-toggle"
                  :class="{ active: tenant.assinatura.ativa }"
                  @click="toggleSubscription(tenant._id)"
                  :title="tenant.assinatura.ativa ? 'Desativar' : 'Ativar'"
                >
                  {{ tenant.assinatura.ativa ? '⊗' : '✓' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Cards para mobile -->
      <div v-if="!loading" class="subscriptions-grid">
        <div v-for="tenant in tenants" :key="tenant._id" class="subscription-card">
          <div class="card-header">
            <h3>{{ tenant.provedor.nome }}</h3>
            <span class="badge" :class="{ 'badge-active': tenant.assinatura.ativa }">
              {{ tenant.assinatura.ativa ? 'Ativa' : 'Inativa' }}
            </span>
          </div>
          <div class="card-body">
            <div class="card-row">
              <span class="card-label">CNPJ:</span>
              <span class="card-value">{{ tenant.provedor.cnpj }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Plano:</span>
              <span class="card-value">{{ tenant.assinatura.plano }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Valor Mensal:</span>
              <span class="card-value">R$ {{ getPlanValue(tenant.assinatura.plano).toFixed(2) }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Início:</span>
              <span class="card-value">{{ formatDate(tenant.assinatura.data_inicio) }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Término:</span>
              <span class="card-value" :class="getDaysRemaining(tenant.assinatura.data_fim) === 'Expirada' ? 'expired' : ''">
                {{ formatDate(tenant.assinatura.data_fim) }}
              </span>
            </div>
            <div class="card-row">
              <span class="card-label">Dias Restantes:</span>
              <span class="card-value">{{ getDaysRemaining(tenant.assinatura.data_fim) }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-icon btn-icon-edit" @click="openEditModal(tenant)" title="Editar">
              ✏️
            </button>
            <button
              class="btn-icon btn-icon-toggle"
              :class="{ active: tenant.assinatura.ativa }"
              @click="toggleSubscription(tenant._id)"
              :title="tenant.assinatura.ativa ? 'Desativar' : 'Ativar'"
            >
              {{ tenant.assinatura.ativa ? '⊗' : '✓' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="tenants.length > 0" class="pagination">
      <button @click="page--" :disabled="page === 1" class="btn-small">
        ← Anterior
      </button>
      <span>Página {{ page }} de {{ Math.ceil(total / limit) }}</span>
      <button
        @click="page++"
        :disabled="page >= Math.ceil(total / limit)"
        class="btn-small"
      >
        Próxima →
      </button>
    </div>

    <SubscriptionModal
      :is-open="isModalOpen"
      :subscription="selectedSubscription"
      :admin-token="authStore.adminToken || ''"
      @close="closeModal"
      @save="handleSaveSubscription"
    />
  </div>
</template>

<style scoped>

.admin-subscriptions {
  max-width: 1200px;
}

.page-header {
  margin-bottom: 2rem;
  /* margin-top: 2rem; */
  text-align: left;
}

.page-header h2 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

/* ===== ERROR MESSAGE ===== */
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

/* ===== LOADING & EMPTY ===== */
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

/* ===== TABLE CONTAINER ===== */
.table-container {
  background: var(--bg-white);
  border-radius: 10px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin-bottom: 2rem;
}

.subscriptions-table {
  width: 100%;
  border-collapse: collapse;
}

.subscriptions-table thead {
  background: var(--bg-light);
  border-bottom: 1px solid var(--border);
}

.subscriptions-table th {
  padding: 1rem 1.25rem;
  text-align: left;
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.subscriptions-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.subscriptions-table tbody tr {
  transition: all 0.2s ease;
}

.subscriptions-table tbody tr:hover {
  background: var(--primary-light);
}

.subscriptions-table tbody tr:last-child td {
  border-bottom: none;
}

/* ===== PROVIDER CELL ===== */
.provider-cell {
  font-weight: 500;
}

.provider-info {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.provider-info strong {
  color: var(--text-primary);
  font-weight: 700;
}

.provider-info small {
  color: var(--text-light);
  font-size: 0.8rem;
  font-family: 'Monaco', 'Courier', monospace;
  letter-spacing: 0.5px;
}

/* ===== BADGES ===== */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--danger-light);
  color: var(--danger);
}

.badge::before {
  content: '●';
  font-size: 0.6rem;
}

.badge-active {
  background: #dcfce7;
  color: var(--secondary);
}

.badge-plan {
  background: #dbeafe;
  color: #0284c7;
}

.badge-plan::before {
  content: '💎';
  margin-right: 0.25rem;
}

/* ===== DATE & TIME ===== */
.expired {
  color: var(--danger);
  font-weight: 700;
}

.remaining {
  display: block;
  color: var(--text-light);
  font-size: 0.75rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* ===== ACTIONS ===== */
.actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.normal-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-light);
  color: var(--text-secondary);
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
}

.btn-icon:hover {
  transform: scale(1.1);
}

.btn-icon-edit {
  background: #dbeafe;
  color: #0284c7;
}

.btn-icon-edit:hover {
  background: #0284c7;
  color: white;
}

.btn-icon-toggle {
  background: var(--warning-light);
  color: var(--warning);
}

.btn-icon-toggle:hover {
  background: var(--warning);
  color: white;
}

.btn-icon-toggle.active {
  background: #dcfce7;
  color: var(--secondary);
}

.btn-icon-toggle.active:hover {
  background: var(--secondary);
  color: white;
}

/* ===== PAGINATION ===== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.pagination span {
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-small {
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  background: var(--bg-white);
  color: var(--text-primary);
  white-space: nowrap;
}

.btn-small:hover:not(:disabled) {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== RESPONSIVE ===== */
.subscriptions-grid {
  display: none;
}

@media (max-width: 1024px) {
  .subscriptions-table th,
  .subscriptions-table td {
    padding: 0.875rem;
    font-size: 0.9rem;
  }

  .subscriptions-table th {
    font-size: 0.8rem;
  }

  .btn-icon {
    width: 36px;
    height: 36px;
    font-size: 0.95rem;
  }
}

@media (max-width: 768px) {
  .page-header h2 {
    font-size: 1.5rem;
  }

  .subscriptions-table {
    display: none;
  }

  .subscriptions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .subscription-card {
    background: var(--bg-white);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.3s ease;
  }

  .subscription-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 1rem;
  }

  .card-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text-primary);
    font-weight: 700;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-label {
    font-weight: 600;
    color: var(--text-light);
    font-size: 0.9rem;
  }

  .card-value {
    color: var(--text-primary);
    font-size: 0.95rem;
  }

  .card-value.expired {
    color: var(--danger);
    font-weight: 600;
  }

  .card-actions {
    display: flex;
    gap: 0.75rem;
    border-top: 1px solid var(--border);
    padding-top: 1rem;
  }

  .card-actions .btn-icon {
    flex: 1;
    justify-content: center;
  }

  .provider-info small {
    font-size: 0.75rem;
  }

  .badge {
    font-size: 0.7rem;
    padding: 0.25rem 0.625rem;
  }

  .btn-icon {
    width: 34px;
    height: 34px;
    font-size: 0.9rem;
  }

  .remaining {
    font-size: 0.7rem;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .page-header h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .subscriptions-grid {
    grid-template-columns: 1fr;
  }

  .subscription-card {
    padding: 1rem;
  }

  .card-header {
    padding-bottom: 0.75rem;
  }

  .card-header h3 {
    font-size: 1rem;
  }

  .card-body {
    gap: 0.5rem;
  }

  .card-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .card-label {
    font-size: 0.8rem;
  }

  .card-value {
    font-size: 0.9rem;
  }

  .card-actions {
    padding-top: 0.75rem;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }

  .badge {
    font-size: 0.65rem;
    padding: 0.2rem 0.5rem;
  }
}
</style>
