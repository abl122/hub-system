<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/services/api'

const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')

const stats = ref({
  totalProvedores: 0,
  receitaMensal: 0,
  mensagensProcessadas: 0,
  alertasAtivos: 0
})

const activities = ref<any[]>([])
const alerts = ref<any[]>([])
const health = ref({
  api: 'online',
  database: 'operacional',
  emailService: 'ativo',
  whatsappAPI: 'operacional',
  smsGateway: 'ativo'
})

const loadStats = async () => {
  try {
    const response = await apiFetch('/admin/dashboard/stats', { token: authStore.adminToken })
    if (response.success) {
      stats.value = response.stats
    }
  } catch (err: any) {
    console.error('Erro ao carregar stats:', err)
  }
}

const loadActivities = async () => {
  try {
    const response = await apiFetch('/admin/dashboard/activities?limit=10', { token: authStore.adminToken })
    if (response.success) {
      activities.value = response.activities
    }
  } catch (err: any) {
    console.error('Erro ao carregar atividades:', err)
  }
}

const loadAlerts = async () => {
  try {
    const response = await apiFetch('/admin/dashboard/alerts', { token: authStore.adminToken })
    if (response.success) {
      alerts.value = response.alerts
    }
  } catch (err: any) {
    console.error('Erro ao carregar alertas:', err)
  }
}

const loadHealth = async () => {
  try {
    const response = await apiFetch('/admin/dashboard/health', { token: authStore.adminToken })
    if (response.success) {
      health.value = response.health
    }
  } catch (err: any) {
    console.error('Erro ao carregar health:', err)
  }
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await Promise.all([
      loadStats(),
      loadActivities(),
      loadAlerts(),
      loadHealth()
    ])
  } catch (err: any) {
    error.value = err.message || 'Erro ao carregar dados'
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="admin-dashboard">
    <div class="container">
      <h2>Dashboard Administrativo</h2>

      <div v-if="loading" class="loading">Carregando...</div>

      <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <p class="stat-label">Total de Provedores</p>
          <p class="stat-value">{{ stats.totalProvedores }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <p class="stat-label">Receita Mensal</p>
          <p class="stat-value">{{ formatCurrency(stats.receitaMensal) }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📱</div>
        <div class="stat-info">
          <p class="stat-label">Mensagens Processadas</p>
          <p class="stat-value">{{ formatNumber(stats.mensagensProcessadas) }}</p>
        </div>
      </div>

      </div>

      <div class="dashboard-cards">
      <div class="card">
        <h3>Atividade Recente</h3>
        <div v-if="activities.length === 0" class="empty-state">
          Nenhuma atividade registrada ainda
        </div>
        <div v-else class="activity-list">
          <div v-for="activity in activities" :key="activity.id" class="activity-item">
            <span class="time">{{ activity.hora }}</span>
            <span class="text">
              {{ activity.titulo }}
              <span v-if="activity.tenant" class="tenant-name">- {{ activity.tenant }}</span>
            </span>
          </div>
        </div>
      </div>

      <div class="card" v-if="alerts.length > 0">
        <h3>Alertas do Sistema</h3>
        <div class="alerts-list">
          <div 
            v-for="(alert, index) in alerts" 
            :key="index" 
            class="alert-item"
            :class="`alert-${alert.tipo}`"
          >
            <div class="alert-header">
              <span class="alert-icon">
                {{ alert.tipo === 'error' ? '🔴' : alert.tipo === 'warning' ? '🟡' : 'ℹ️' }}
              </span>
              <span class="alert-title">{{ alert.titulo }}</span>
              <span class="alert-count">{{ alert.count }}</span>
            </div>
            <p class="alert-description">{{ alert.descricao }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Saúde do Sistema</h3>
        <div class="health-info">
          <div class="health-item">
            <span class="label">API Status</span>
            <span 
              class="badge" 
              :class="health.api === 'online' ? 'badge-success' : 'badge-error'"
            >
              {{ health.api === 'online' ? 'Online' : 'Offline' }}
            </span>
          </div>
          <div class="health-item">
            <span class="label">Database</span>
            <span 
              class="badge" 
              :class="health.database === 'operacional' ? 'badge-success' : 'badge-error'"
            >
              {{ health.database === 'operacional' ? 'Operacional' : 'Erro' }}
            </span>
          </div>
          <div class="health-item">
            <span class="label">Email Service</span>
            <span 
              class="badge" 
              :class="health.emailService === 'ativo' ? 'badge-success' : 'badge-error'"
            >
              {{ health.emailService === 'ativo' ? 'Ativo' : 'Inativo' }}
            </span>
          </div>
          <div class="health-item">
            <span class="label">WhatsApp API</span>
            <span 
              class="badge" 
              :class="health.whatsappAPI === 'operacional' ? 'badge-success' : 'badge-error'"
            >
              {{ health.whatsappAPI === 'operacional' ? 'Operacional' : 'Erro' }}
            </span>
          </div>
          <div class="health-item">
            <span class="label">SMS Service</span>
            <span class="badge badge-success">Ativo</span>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard {
  width: 100%;
  padding: 2rem 0;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  /* padding: 0 1rem; */
}

.admin-dashboard h2 {
  margin: 0 0 2rem 0;
  /* margin-top: 2rem; */
  color: var(--text-primary);
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  text-align: left;
}

/* ===== STATS GRID ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: var(--bg-white);
  padding: 1.5rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card:nth-child(2)::before,
.stat-card:nth-child(2):hover {
  background: linear-gradient(180deg, var(--secondary) 0%, #047857 100%);
  border-color: var(--secondary);
}

.stat-card:nth-child(3)::before,
.stat-card:nth-child(3):hover {
  background: linear-gradient(180deg, var(--warning) 0%, #d97706 100%);
  border-color: var(--warning);
}

.stat-card:nth-child(4)::before,
.stat-card:nth-child(4):hover {
  background: linear-gradient(180deg, var(--danger) 0%, #991b1b 100%);
  border-color: var(--danger);
}

.stat-icon {
  font-size: 2.5rem;
  min-width: 50px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.stat-info {
  flex: 1;
}

.stat-label {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.stat-value {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

/* ===== DASHBOARD CARDS ===== */
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.card {
  background: var(--bg-white);
  padding: 1.75rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.card h3 {
  margin: 0 0 1.25rem 0;
  color: var(--text-primary);
  font-size: 1.125rem;
  font-weight: 700;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border);
}

/* ===== ACTIVITY LIST ===== */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  gap: 1rem;
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--border);
  transition: all 0.2s;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: var(--primary-light);
  padding: 0.875rem 0.75rem;
  border-radius: 6px;
  margin: 0 -0.75rem;
  padding-left: 0.75rem;
}

.activity-item .time {
  color: var(--primary);
  font-weight: 700;
  min-width: 55px;
  font-size: 0.875rem;
}

.activity-item .text {
  color: var(--text-secondary);
  flex: 1;
  font-size: 0.9rem;
}

/* ===== HEALTH INFO ===== */
.health-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.health-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-light);
  border-radius: 8px;
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.health-item:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.health-item .label {
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  width: fit-content;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-success {
  background: #dcfce7;
  color: #166534;
}

.badge-success::before {
  content: '✓';
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}

.badge-warning::before {
  content: '⚠';
}

.badge-danger, .badge-error {
  background: #fee2e2;
  color: #991b1b;
}

.badge-danger::before, .badge-error::before {
  content: '✕';
}

/* Alertas */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-item {
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.alert-error {
  background: #fee2e2;
  border-color: #dc2626;
}

.alert-warning {
  background: #fef3c7;
  border-color: #f59e0b;
}

.alert-info {
  background: #dbeafe;
  border-color: #3b82f6;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.alert-icon {
  font-size: 1.25rem;
}

.alert-title {
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.alert-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
}

.alert-description {
  margin: 0;
  color: #4b5563;
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
  font-style: italic;
}

.tenant-name {
  color: #6b7280;
  font-size: 0.875rem;
}

.stat-card-warning {
  border: 2px solid #f59e0b;
  background: #fffbeb;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .dashboard-cards {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1.5rem 0;
  }

  .admin-dashboard h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .stats-grid {
    gap: 1rem;
    margin-bottom: 1.75rem;
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1.25rem;
    gap: 1rem;
  }

  .stat-icon {
    font-size: 2rem;
    min-width: 45px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.8rem;
  }

  .dashboard-cards {
    gap: 1.5rem;
  }

  .card {
    padding: 1.25rem;
  }

  .card h3 {
    font-size: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
  }

  .activity-item {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 0;
  }

  .activity-item .time {
    min-width: auto;
    font-size: 0.8rem;
  }

  .activity-item .text {
    font-size: 0.85rem;
  }

  .health-info {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .health-item {
    padding: 0.875rem;
  }

  .badge {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }

  .alert-item {
    padding: 0.875rem;
  }

  .alert-header {
    gap: 0.5rem;
  }

  .alert-title {
    font-size: 0.9rem;
  }

  .alert-description {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .admin-dashboard {
    padding: 1rem 0;
  }

  .admin-dashboard h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .stats-grid {
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .stat-card {
    padding: 1rem;
    gap: 0.875rem;
  }

  .stat-icon {
    font-size: 1.75rem;
    min-width: 40px;
  }

  .stat-value {
    font-size: 1.35rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .dashboard-cards {
    gap: 1rem;
  }

  .card {
    padding: 1rem;
  }

  .card h3 {
    font-size: 0.95rem;
  }

  .health-info {
    gap: 0.5rem;
  }

  .health-item {
    padding: 0.75rem;
  }

  .health-item .label {
    font-size: 0.75rem;
  }

  .badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }

  .alert-icon {
    font-size: 1rem;
  }

  .alert-title {
    font-size: 0.85rem;
  }

  .alert-count {
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
  }
}
</style>
