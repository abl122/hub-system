<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { tenantsService } from '@/services/tenantsService'
import ProviderModal from '@/components/admin/ProviderModal.vue'

interface Tenant {
  _id: string
  provedor: {
    nome: string
    cnpj: string
    email: string
    dominio: string
    razao_social?: string
    telefone?: string
  }
  assinatura: {
    plano: string
    ativa: boolean
    valor_mensal?: number
    data_inicio?: string
    data_fim?: string
  }
  agente?: {
    url: string
    token: string
    ativo: boolean
  }
  color_primary?: string
  color_secondary?: string
}

const authStore = useAuthStore()
const tenants = ref<Tenant[]>([])
const searchTerm = ref('')
const loading = ref(false)
const error = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const isModalOpen = ref(false)
const selectedProvider = ref<Tenant | null>(null)

const filteredTenants = computed(() => {
  if (!tenants.value) return []
  if (!searchTerm.value) return tenants.value

  return tenants.value.filter(t =>
    t.provedor.nome.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    t.provedor.email.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    t.provedor.cnpj.includes(searchTerm.value)
  )
})

const loadTenants = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!authStore.adminToken) {
      error.value = 'Não autenticado'
      return
    }

    const response = await tenantsService.listTenants(
      authStore.adminToken,
      page.value,
      limit.value,
      searchTerm.value ? {
        nome: searchTerm.value
      } : undefined
    )

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

const handleSearch = () => {
  page.value = 1
  loadTenants()
}

const handleOpenModal = (tenant?: Tenant) => {
  if (tenant) {
    selectedProvider.value = tenant
  } else {
    selectedProvider.value = null
  }
  isModalOpen.value = true
}

const handleCloseModal = () => {
  isModalOpen.value = false
  selectedProvider.value = null
}

const handleSaveProvider = () => {
  loadTenants()
}

const handleEdit = (tenantId: string) => {
  const tenant = tenants.value.find(t => t._id === tenantId)
  if (tenant) {
    handleOpenModal(tenant)
  }
}

const handleDelete = async (tenantId: string) => {
  if (!confirm('Tem certeza que deseja deletar este provedor? Esta ação não pode ser desfeita.')) return

  try {
    if (!authStore.adminToken) {
      error.value = 'Não autenticado'
      return
    }

    await tenantsService.deleteTenant(tenantId, authStore.adminToken)
    loadTenants()
  } catch (err) {
    error.value = 'Erro ao deletar provedor'
    console.error(err)
  }
}

onMounted(() => {
  loadTenants()
})
</script>

<template>
  <div class="admin-provedores">
    <ProviderModal
      :isOpen="isModalOpen"
      :provider="selectedProvider"
      :adminToken="authStore.adminToken"
      @close="handleCloseModal"
      @save="handleSaveProvider"
    />

    <div class="page-header">
      <h2>Gerenciar Provedores</h2>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="filters">
      <input
        v-model="searchTerm"
        @input="handleSearch"
        type="text"
        placeholder="Buscar por nome, email ou CNPJ..."
        class="search-input"
      />
      <button class="btn btn-primary" @click="handleOpenModal">+ Novo Provedor</button>
    </div>

    <div class="table-container">
      <div v-if="loading" class="loading">Carregando...</div>
      <table v-else class="tenants-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>CNPJ</th>
            <th>Plano</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tenant in filteredTenants" :key="tenant._id">
            <td>{{ tenant.provedor.nome }}</td>
            <td>{{ tenant.provedor.email }}</td>
            <td>{{ tenant.provedor.cnpj }}</td>
            <td>{{ tenant.assinatura.plano }}</td>
            <td>
              <span class="badge" :class="{ 'badge-active': tenant.assinatura.ativa }">
                {{ tenant.assinatura.ativa ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-icon btn-icon-edit" @click="handleEdit(tenant._id)" title="Editar">
                ✏️
              </button>
              <button class="btn-icon btn-icon-delete" @click="handleDelete(tenant._id)" title="Remover">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="filteredTenants.length === 0 && !loading" class="empty-state">
      <p>Nenhum provedor encontrado</p>
    </div>

    <div class="pagination">
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
  </div>
</template>

<style scoped>

.admin-provedores {
  max-width: 1200px;
}

.admin-provedores h2 {
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
  max-width: 1200px;
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

/* ===== FILTERS ===== */
.filters {
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--bg-white);
  color: var(--text-primary);
  transition: all 0.3s ease;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--text-light);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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

/* ===== TABLE CONTAINER ===== */
.table-container {
  background: var(--bg-white);
  border-radius: 10px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin-bottom: 2rem;
}

.tenants-table {
  width: 100%;
  border-collapse: collapse;
}

.tenants-table thead {
  background: var(--bg-light);
  border-bottom: 1px solid var(--border);
}

.tenants-table th {
  padding: 1rem 1.25rem;
  text-align: left;
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tenants-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.tenants-table tbody tr {
  transition: all 0.2s ease;
}

.tenants-table tbody tr:hover {
  background: var(--primary-light);
}

.tenants-table tbody tr:last-child td {
  border-bottom: none;
}

/* ===== BADGE ===== */
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

.badge-active {
  background: #dcfce7;
  color: var(--secondary);
}

.badge::before {
  content: '●';
  font-size: 0.7rem;
}

/* ===== ACTIONS ===== */
.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
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

.btn-icon-delete {
  background: var(--danger-light);
  color: var(--danger);
}

.btn-icon-delete:hover {
  background: var(--danger);
  color: white;
}

/* ===== LOADING STATE ===== */
.loading {
  text-align: center;
  padding: 3rem;
  color: var(--primary);
  font-weight: 600;
  font-size: 1.05rem;
}

/* ===== EMPTY STATE ===== */
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
@media (max-width: 1024px) {
  .filters {
    flex-direction: column;
    gap: 1rem;
  }

  .search-input,
  .btn {
    width: 100%;
  }

  .tenants-table th,
  .tenants-table td {
    padding: 0.875rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .admin-provedores h2 {
    font-size: 1.5rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filters {
    width: 100%;
  }

  .search-input,
  .btn {
    width: 100%;
  }

  .tenants-table {
    font-size: 0.85rem;
  }

  .tenants-table th,
  .tenants-table td {
    padding: 0.75rem 0.5rem;
  }

  .tenants-table th {
    font-size: 0.75rem;
  }

  .btn-icon {
    width: 34px;
    height: 34px;
    font-size: 0.9rem;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.625rem;
  }
}

@media (max-width: 480px) {
  .admin-provedores h2 {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .tenants-table th {
    font-size: 0.7rem;
    padding: 0.5rem 0.25rem;
  }

  .tenants-table td {
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
