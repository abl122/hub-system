<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface Payment {
  _id: string
  data: string
  valor: number
  status: 'pendente' | 'pago' | 'cancelado' | 'reembolsado'
  metodo: string
  descricao: string
  fatura_url?: string
}

interface PaymentMethod {
  tipo: 'cartao' | 'boleto' | 'pix'
  numero?: string
  bandeira?: string
  validade?: string
  principal: boolean
}

const authStore = useAuthStore()
const loading = ref(false)
const payments = ref<Payment[]>([])
const paymentMethods = ref<PaymentMethod[]>([])
const showAddCardModal = ref(false)
const showUpdateCardModal = ref(false)

// Simulação de dados (em produção, viria da API)
const loadPayments = async () => {
  loading.value = true
  
  try {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Dados de exemplo
    payments.value = [
      {
        _id: '1',
        data: new Date().toISOString(),
        valor: 49.90,
        status: 'pago',
        metodo: 'Cartão de Crédito',
        descricao: 'Assinatura Mensal - ' + new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        fatura_url: '#'
      },
      {
        _id: '2',
        data: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        valor: 49.90,
        status: 'pago',
        metodo: 'Cartão de Crédito',
        descricao: 'Assinatura Mensal - ' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        fatura_url: '#'
      }
    ]

    paymentMethods.value = [
      {
        tipo: 'cartao',
        numero: '**** **** **** 1234',
        bandeira: 'Visa',
        validade: '12/2026',
        principal: true
      }
    ]

  } catch (err) {
    console.error('Erro ao carregar pagamentos:', err)
  } finally {
    loading.value = false
  }
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'pago': 'status-paid',
    'pendente': 'status-pending',
    'cancelado': 'status-cancelled',
    'reembolsado': 'status-refunded'
  }
  return classes[status] || ''
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'pago': 'Pago',
    'pendente': 'Pendente',
    'cancelado': 'Cancelado',
    'reembolsado': 'Reembolsado'
  }
  return texts[status] || status
}

const totalPago = computed(() => {
  return payments.value
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + p.valor, 0)
})

const handleAddCard = () => {
  alert('Redirecionando para gateway de pagamento seguro...')
  showAddCardModal.value = false
}

const handleUpdateCard = () => {
  alert('Redirecionando para atualização de cartão...')
  showUpdateCardModal.value = false
}

const handleDownloadInvoice = (payment: Payment) => {
  if (payment.fatura_url) {
    window.open(payment.fatura_url, '_blank')
  }
}

onMounted(() => {
  loadPayments()
})
</script>

<template>
  <div class="payments-page">
    <div class="page-header">
      <h1>💳 Pagamentos & Faturas</h1>
      <p>Gerencie suas formas de pagamento e histórico de transações</p>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>

    <div v-if="!loading" class="payments-content">
      <!-- Resumo de Pagamentos -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <h3>Total Pago</h3>
            <p class="stat-value">R$ {{ totalPago.toFixed(2) }}</p>
            <span class="stat-label">Histórico total</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <h3>Próximo Pagamento</h3>
            <p class="stat-value">R$ 49,90</p>
            <span class="stat-label">Em {{ new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR') }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <h3>Transações</h3>
            <p class="stat-value">{{ payments.length }}</p>
            <span class="stat-label">Total de pagamentos</span>
          </div>
        </div>
      </div>

      <!-- Formas de Pagamento -->
      <div class="card">
        <div class="card-header">
          <h2>💳 Formas de Pagamento</h2>
          <button @click="showAddCardModal = true" class="btn btn-primary">
            + Adicionar Cartão
          </button>
        </div>
        <div class="card-body">
          <div v-if="paymentMethods.length === 0" class="empty-state">
            <p>Nenhuma forma de pagamento cadastrada</p>
            <button @click="showAddCardModal = true" class="btn btn-primary">
              Adicionar Cartão
            </button>
          </div>

          <div v-else class="payment-methods-grid">
            <div 
              v-for="method in paymentMethods" 
              :key="method.numero"
              class="payment-method-card"
              :class="{ 'primary': method.principal }"
            >
              <div class="card-visual">
                <div class="card-chip"></div>
                <div class="card-number">{{ method.numero }}</div>
                <div class="card-info">
                  <span class="card-brand">{{ method.bandeira }}</span>
                  <span class="card-expiry">{{ method.validade }}</span>
                </div>
              </div>
              <div class="card-actions">
                <span v-if="method.principal" class="primary-badge">Principal</span>
                <button @click="showUpdateCardModal = true" class="btn-text">Atualizar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Histórico de Pagamentos -->
      <div class="card">
        <div class="card-header">
          <h2>📋 Histórico de Pagamentos</h2>
        </div>
        <div class="card-body">
          <div v-if="payments.length === 0" class="empty-state">
            <p>Nenhuma transação encontrada</p>
          </div>

          <div v-else class="payments-table">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Método</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payment in payments" :key="payment._id">
                  <td>{{ new Date(payment.data).toLocaleDateString('pt-BR') }}</td>
                  <td>{{ payment.descricao }}</td>
                  <td>{{ payment.metodo }}</td>
                  <td class="amount">R$ {{ payment.valor.toFixed(2) }}</td>
                  <td>
                    <span class="status-badge" :class="getStatusClass(payment.status)">
                      {{ getStatusText(payment.status) }}
                    </span>
                  </td>
                  <td>
                    <button 
                      v-if="payment.status === 'pago' && payment.fatura_url"
                      @click="handleDownloadInvoice(payment)" 
                      class="btn-icon"
                      title="Baixar fatura"
                    >
                      📄
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Informações Adicionais -->
      <div class="card">
        <div class="card-header">
          <h2>ℹ️ Informações de Pagamento</h2>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-section">
              <h3>🔒 Segurança</h3>
              <ul>
                <li>Todos os pagamentos são processados de forma segura</li>
                <li>Não armazenamos dados completos do cartão</li>
                <li>Certificado SSL/TLS em todas as transações</li>
                <li>Conformidade com PCI-DSS</li>
              </ul>
            </div>

            <div class="info-section">
              <h3>📅 Cobrança</h3>
              <ul>
                <li>Renovação automática mensal</li>
                <li>Cobrança no mesmo dia todo mês</li>
                <li>E-mail de confirmação após pagamento</li>
                <li>Fatura disponível em até 24h</li>
              </ul>
            </div>

            <div class="info-section">
              <h3>💰 Formas de Pagamento</h3>
              <ul>
                <li>Cartão de Crédito (Visa, Master, Elo)</li>
                <li>Boleto Bancário</li>
                <li>PIX (em breve)</li>
              </ul>
            </div>

            <div class="info-section">
              <h3>❓ Dúvidas</h3>
              <ul>
                <li>Pagamento não identificado? Aguarde 24h</li>
                <li>Problemas com cartão? Verifique limite</li>
                <li>Precisa de reembolso? Entre em contato</li>
                <li>Suporte: suporte@mkedge.com</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Adicionar Cartão -->
    <div v-if="showAddCardModal" class="modal-overlay" @click="showAddCardModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Adicionar Cartão de Crédito</h3>
          <button @click="showAddCardModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="info-box">
            <p>🔒 Você será redirecionado para nosso gateway de pagamento seguro.</p>
            <p>Seus dados de cartão não serão armazenados em nossos servidores.</p>
          </div>
          <div class="form-group">
            <label>Método de Pagamento:</label>
            <select class="form-input">
              <option>Cartão de Crédito</option>
              <option>Boleto Bancário</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAddCardModal = false" class="btn btn-secondary">Cancelar</button>
          <button @click="handleAddCard" class="btn btn-primary">Continuar</button>
        </div>
      </div>
    </div>

    <!-- Modal Atualizar Cartão -->
    <div v-if="showUpdateCardModal" class="modal-overlay" @click="showUpdateCardModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Atualizar Cartão</h3>
          <button @click="showUpdateCardModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>Você será redirecionado para atualizar os dados do seu cartão de forma segura.</p>
          <div class="warning-box">
            <p>⚠️ O cartão atual será substituído pelo novo.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showUpdateCardModal = false" class="btn btn-secondary">Cancelar</button>
          <button @click="handleUpdateCard" class="btn btn-primary">Continuar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payments-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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

.payments-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.stat-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.stat-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 0.875rem;
  color: #999;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.card-body {
  padding: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-state p {
  margin: 0 0 1rem 0;
}

.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.payment-method-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
}

.payment-method-card.primary {
  border-color: #667eea;
}

.payment-method-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-visual {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  color: white;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-chip {
  width: 50px;
  height: 40px;
  background: linear-gradient(135deg, #f4c430 0%, #e0ac00 100%);
  border-radius: 6px;
}

.card-number {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 1.5rem;
  letter-spacing: 2px;
  font-weight: 600;
}

.card-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  opacity: 0.9;
}

.card-actions {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.primary-badge {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.btn-text {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.3s;
}

.btn-text:hover {
  color: #5568d3;
  text-decoration: underline;
}

.payments-table {
  overflow-x: auto;
}

.payments-table table {
  width: 100%;
  border-collapse: collapse;
}

.payments-table th,
.payments-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.payments-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #333;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payments-table td {
  color: #666;
}

.payments-table .amount {
  font-weight: 700;
  color: #333;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-paid {
  background: #d1fae5;
  color: #065f46;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-cancelled,
.status-refunded {
  background: #fee2e2;
  color: #991b1b;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-icon:hover {
  transform: scale(1.2);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.info-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.125rem;
}

.info-section ul {
  margin: 0;
  padding-left: 1.25rem;
}

.info-section li {
  padding: 0.375rem 0;
  color: #666;
  line-height: 1.6;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
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
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
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
  max-width: 500px;
  width: 90%;
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

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.info-box {
  background: #dbeafe;
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.info-box p {
  margin: 0.5rem 0;
  color: #1e3a8a;
}

.warning-box {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.warning-box p {
  margin: 0;
  color: #92400e;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  text-align: left;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  background: #fff !important;
  color: #1f2937 !important;
}

@media (max-width: 768px) {
  .payments-page {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .payment-methods-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
