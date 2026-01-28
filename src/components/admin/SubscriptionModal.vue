<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { tenantsService } from '@/services/tenantsService'
import { plansService } from '@/services/plansService'

export interface Subscription {
  tenantId: string
  tenantName: string
  cnpj: string
  assinatura: {
    plano: string
    ativa: boolean
    valor_mensal: number
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

interface Props {
  isOpen: boolean
  subscription?: Subscription | null
  adminToken: string
}

interface Emits {
  (e: 'close'): void
  (e: 'save', subscription: Subscription): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const allPlans = ref<AvailablePlan[]>([])

const formData = ref<Subscription>({
  tenantId: '',
  tenantName: '',
  cnpj: '',
  assinatura: {
    plano: '',
    ativa: true,
    valor_mensal: 0,
    data_inicio: '',
    data_fim: ''
  }
})

const title = computed(() => 'Editar Assinatura')

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal) {
      // Primeiro copia os dados do subscription para formData
      if (props.subscription) {
        formData.value = { ...props.subscription }
        // Converter datas do formato ISO para yyyy-MM-dd
        if (formData.value.assinatura.data_inicio) {
          formData.value.assinatura.data_inicio = formatDateForInput(formData.value.assinatura.data_inicio)
        }
        if (formData.value.assinatura.data_fim) {
          formData.value.assinatura.data_fim = formatDateForInput(formData.value.assinatura.data_fim)
        }
      }
      
      // Depois carrega os planos (agora tenantId já está definido)
      await loadPlans()
      
      // Se o plano atual não existe na lista, seleciona o primeiro plano disponível
      if (props.subscription) {
        const planoExiste = allPlans.value.some(p => p.slug === formData.value.assinatura.plano)
        if (!planoExiste && allPlans.value.length > 0) {
          formData.value.assinatura.plano = allPlans.value[0].slug
        }
      }
    }
    errorMessage.value = ''
  }
)

const loadPlans = async () => {
  try {
    if (!formData.value.tenantId) {
      console.error('tenantId não definido')
      return
    }

    // Usar o novo endpoint de admin que lista planos de um tenant específico
    const response = await plansService.listTenantPlans(
      formData.value.tenantId,
      props.adminToken,
      true // activeOnly
    )

    if (response.success) {
      allPlans.value = response.plans as any
    } else {
      console.error('Erro ao carregar planos:', response)
    }
  } catch (err) {
    console.error('Erro ao carregar planos:', err)
  }
}

const validateForm = (): boolean => {
  errorMessage.value = ''

  if (!formData.value.assinatura.plano) {
    errorMessage.value = 'Plano é obrigatório'
    return false
  }

  // Se não for vitalício, data de fim é obrigatória
  if (!isVitalicioPlano.value && !formData.value.assinatura.data_fim) {
    errorMessage.value = 'Data de término é obrigatória para planos com período definido'
    return false
  }

  if (formData.value.assinatura.data_inicio && formData.value.assinatura.data_fim) {
    if (new Date(formData.value.assinatura.data_inicio) > new Date(formData.value.assinatura.data_fim)) {
      errorMessage.value = 'Data de início não pode ser maior que data de término'
      return false
    }
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true

  try {
    // Converter datas de yyyy-MM-dd para ISO
    const data_inicio = formData.value.assinatura.data_inicio 
      ? new Date(formData.value.assinatura.data_inicio + 'T00:00:00Z').toISOString()
      : undefined
    
    const data_fim = isVitalicioPlano.value 
      ? undefined
      : (formData.value.assinatura.data_fim
          ? new Date(formData.value.assinatura.data_fim + 'T00:00:00Z').toISOString()
          : undefined)

    const updateData = {
      assinatura: {
        plano: formData.value.assinatura.plano,
        ativa: formData.value.assinatura.ativa,
        valor_mensal: getCurrentPlanValue.value,
        data_inicio,
        data_fim
      }
    }

    const response = await tenantsService.updateTenant(
      formData.value.tenantId,
      updateData as any,
      props.adminToken
    )

    if (response.success) {
      successMessage.value = 'Assinatura atualizada com sucesso!'
      setTimeout(() => {
        emit('save', formData.value)
        emit('close')
      }, 1500)
    } else {
      errorMessage.value = response.message || 'Erro ao atualizar assinatura'
      successMessage.value = ''
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Erro ao salvar assinatura'
    successMessage.value = ''
  } finally {
    isLoading.value = false
  }
}

const handleClose = () => {
  errorMessage.value = ''
  successMessage.value = ''
  emit('close')
}

const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getCurrentPlan = () => {
  return allPlans.value.find(p => p.slug === formData.value.assinatura.plano)
}

const isVitalicioPlano = computed(() => {
  const currentPlan = getCurrentPlan()
  return currentPlan?.periodo === 'vitalicio'
})

const getCurrentPlanName = computed(() => {
  const currentPlan = getCurrentPlan()
  return currentPlan ? `${currentPlan.nome} (${currentPlan.slug})` : formData.value.assinatura.plano || 'Nenhum plano selecionado'
})

const getCurrentPlanValue = computed(() => {
  const currentPlan = getCurrentPlan()
  return currentPlan ? currentPlan.valor_mensal : formData.value.assinatura.valor_mensal
})
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="modal-body">
        <div v-if="successMessage" class="success-message">
          ✓ {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="error-message">
          ✗ {{ errorMessage }}
        </div>

        <div class="form-section">
          <h4>Informações do Provedor</h4>

          <div class="form-row">
            <div class="form-group">
              <label>Nome</label>
              <input
                v-model="formData.tenantName"
                type="text"
                class="form-input"
                disabled
              />
            </div>

            <div class="form-group">
              <label>CNPJ</label>
              <input
                v-model="formData.cnpj"
                type="text"
                class="form-input"
                disabled
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4>Dados da Assinatura</h4>

          <div class="form-row">
            <div class="form-group">
              <label for="plano">Plano Atual</label>
              <input
                id="plano"
                v-model="getCurrentPlanName"
                type="text"
                class="form-input"
                disabled
                style="background-color: #f5f5f5; cursor: not-allowed;"
              />
              <small class="form-hint" style="color: #ff6b6b; font-weight: 600;">
                ⚠️ Para alterar o plano, edite o cadastro do provedor
              </small>
            </div>

            <div class="form-group">
              <label for="valor-mensal">Valor Mensal (R$)</label>
              <input
                id="valor-mensal"
                :value="getCurrentPlanValue.toFixed(2)"
                type="text"
                class="form-input"
                disabled
                readonly
              />
              <small class="form-help">Valor definido pelo plano selecionado</small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="data-inicio">Data Início</label>
              <input
                id="data-inicio"
                v-model="formData.assinatura.data_inicio"
                type="date"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="data-fim">Data Término{{ isVitalicioPlano ? '' : ' *' }}</label>
              <input
                id="data-fim"
                v-model="formData.assinatura.data_fim"
                type="date"
                :disabled="isVitalicioPlano"
                class="form-input"
                :placeholder="isVitalicioPlano ? 'Não aplicável - Plano Vitalício' : ''"
              />
              <small v-if="isVitalicioPlano" class="form-hint">Plano vitalício - sem data de término</small>
            </div>
          </div>

          <div class="form-group checkbox">
            <input
              id="assinatura-ativa"
              v-model="formData.assinatura.ativa"
              type="checkbox"
              class="form-checkbox"
            />
            <label for="assinatura-ativa">Assinatura Ativa</label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose" :disabled="isLoading">
          Cancelar
        </button>
        <button class="btn btn-primary" @click="handleSubmit" :disabled="isLoading">
          {{ isLoading ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  background: #f9fafb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h4 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #374151;
  font-weight: 600;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
  text-align: left;
}

.form-input,
.form-color-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
  font-family: inherit;
  background: #fff !important;
  color: #111 !important;
}

.form-input:focus,
.form-color-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input:disabled {
  background: #f3f4f6 !important;
  cursor: not-allowed;
  color: #6b7280 !important;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group.checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.form-group.checkbox label {
  margin: 0;
  cursor: pointer;
}

.form-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border-left: 4px solid #c62828;
  animation: slideIn 0.3s ease-out;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border-left: 4px solid #2e7d32;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 2px solid #e0e0e0;
  background: #f8f9fa;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
