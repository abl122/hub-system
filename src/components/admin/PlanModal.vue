<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { plansService } from '@/services/plansService'

export interface Plan {
  _id?: string
  nome: string
  slug: string
  descricao?: string
  valor_mensal: number
  periodo?: string
  recorrente?: boolean
  limite_clientes?: number | null
  recursos?: string[]
  destaque?: boolean
  cor?: string
  dias_trial?: number
  ativo?: boolean
}

interface Props {
  isOpen: boolean
  plan?: Plan | null
  adminToken: string
  tenantId: string
}

interface Emits {
  (e: 'close'): void
  (e: 'save', plan: Plan): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isLoading = ref(false)
const errorMessage = ref('')
const newResource = ref('')

const formData = ref<Plan>({
  nome: '',
  slug: '',
  descricao: '',
  valor_mensal: 0,
  periodo: 'mensal',
  recorrente: true,
  limite_clientes: null,
  recursos: [],
  destaque: false,
  cor: '#6366f1',
  dias_trial: 7,
  ativo: true
})

const title = computed(() => (props.plan ? 'Editar Plano' : 'Novo Plano'))
const isEditing = computed(() => !!props.plan)

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.plan) {
      formData.value = { ...props.plan }
    } else if (newVal) {
      resetForm()
    }
    errorMessage.value = ''
    newResource.value = ''
  }
)

const resetForm = () => {
  formData.value = {
    nome: '',
    slug: '',
    descricao: '',
    valor_mensal: 0,
    periodo: 'mensal',
    recorrente: true,
    limite_clientes: null,
    recursos: [],
    destaque: false,
    cor: '#6366f1',
    dias_trial: 7,
    ativo: true
  }
}

const validateForm = (): boolean => {
  errorMessage.value = ''

  if (!formData.value.nome?.trim()) {
    errorMessage.value = 'Nome do plano é obrigatório'
    return false
  }

  if (!formData.value.slug?.trim()) {
    errorMessage.value = 'Slug é obrigatório'
    return false
  }

  if (formData.value.slug.includes(' ')) {
    errorMessage.value = 'Slug não pode conter espaços'
    return false
  }

  if (formData.value.valor_mensal < 0) {
    errorMessage.value = 'Valor não pode ser negativo'
    return false
  }

  return true
}

const addResource = () => {
  if (newResource.value.trim()) {
    formData.value.recursos?.push(newResource.value.trim())
    newResource.value = ''
  }
}

const removeResource = (index: number) => {
  formData.value.recursos?.splice(index, 1)
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true

  try {
    if (isEditing.value && props.plan?._id) {
      // Update
      const response = await plansService.updatePlan(
        props.plan._id,
        {
          nome: formData.value.nome,
          descricao: formData.value.descricao,
          valor_mensal: formData.value.valor_mensal,
          periodo: formData.value.periodo,
          limite_clientes: formData.value.limite_clientes,
          recursos: formData.value.recursos,
          destaque: formData.value.destaque,
          cor: formData.value.cor,
          dias_trial: formData.value.dias_trial,
          ativo: formData.value.ativo
        },
        props.adminToken,
        props.tenantId
      )

      if (response.success) {
        emit('save', formData.value)
        emit('close')
      } else {
        errorMessage.value = 'Erro ao atualizar plano'
      }
    } else {
      // Create
      const response = await plansService.createPlan(
        {
          nome: formData.value.nome,
          slug: formData.value.slug,
          descricao: formData.value.descricao,
          valor_mensal: formData.value.valor_mensal,
          periodo: formData.value.periodo,
          recorrente: formData.value.recorrente,
          limite_clientes: formData.value.limite_clientes,
          recursos: formData.value.recursos,
          destaque: formData.value.destaque,
          cor: formData.value.cor,
          dias_trial: formData.value.dias_trial
        },
        props.adminToken,
        props.tenantId
      )

      if (response.success) {
        emit('save', formData.value)
        emit('close')
      } else {
        errorMessage.value = 'Erro ao criar plano'
      }
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Erro ao salvar plano'
  } finally {
    isLoading.value = false
  }
}

const handleClose = () => {
  resetForm()
  errorMessage.value = ''
  newResource.value = ''
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="modal-body">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="form-section">
          <h4>Informações do Plano</h4>

          <div class="form-group">
            <label for="nome">Nome do Plano *</label>
            <input
              id="nome"
              v-model="formData.nome"
              type="text"
              placeholder="Ex: Profissional"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="slug">Slug *</label>
            <input
              id="slug"
              v-model="formData.slug"
              type="text"
              placeholder="Ex: profissional (sem espaços)"
              class="form-input"
              :disabled="isEditing"
            />
          </div>

          <div class="form-group">
            <label for="descricao">Descrição</label>
            <textarea
              id="descricao"
              v-model="formData.descricao"
              rows="3"
              placeholder="Descreva os benefícios do plano..."
              class="form-input"
            ></textarea>
          </div>
        </div>

        <div class="form-section">
          <h4>Preço e Período</h4>

          <div class="form-row">
            <div class="form-group">
              <label for="valor">Valor Mensal (R$) *</label>
              <input
                id="valor"
                v-model.number="formData.valor_mensal"
                type="number"
                step="0.01"
                min="0"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="periodo">Período</label>
              <select id="periodo" v-model="formData.periodo" class="form-input">
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          <div class="form-group checkbox">
            <input
              id="recorrente"
              v-model="formData.recorrente"
              type="checkbox"
              class="form-checkbox"
            />
            <label for="recorrente">Recorrente</label>
          </div>
        </div>

        <div class="form-section">
          <h4>Limite e Trial</h4>

          <div class="form-row">
            <div class="form-group">
              <label for="limite-clientes">Limite de Clientes</label>
              <input
                id="limite-clientes"
                v-model.number="formData.limite_clientes"
                type="number"
                min="0"
                placeholder="Deixe vazio para ilimitado"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="dias-trial">Dias Trial</label>
              <input
                id="dias-trial"
                v-model.number="formData.dias_trial"
                type="number"
                min="0"
                max="365"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4>Recursos</h4>

          <div class="resources-list">
            <div v-for="(resource, idx) in formData.recursos" :key="idx" class="resource-item">
              <span>✓ {{ resource }}</span>
              <button type="button" class="remove-btn" @click="removeResource(idx)">×</button>
            </div>
          </div>

          <div class="resource-input">
            <input
              v-model="newResource"
              type="text"
              placeholder="Adicionar recurso..."
              class="form-input"
              @keyup.enter="addResource"
            />
            <button type="button" class="btn btn-secondary" @click="addResource">
              Adicionar
            </button>
          </div>
        </div>

        <div class="form-section">
          <h4>Aparência</h4>

          <div class="form-row">
            <div class="form-group">
              <label for="cor">Cor Principal</label>
              <div class="color-input-wrapper">
                <input
                  id="cor"
                  v-model="formData.cor"
                  type="color"
                  class="form-color-input"
                />
                <span>{{ formData.cor }}</span>
              </div>
            </div>

            <div class="form-group checkbox">
              <input
                id="destaque"
                v-model="formData.destaque"
                type="checkbox"
                class="form-checkbox"
              />
              <label for="destaque">Destaque</label>
            </div>
          </div>

          <div v-if="!isEditing" class="form-group checkbox">
            <input
              id="ativo"
              v-model="formData.ativo"
              type="checkbox"
              class="form-checkbox"
            />
            <label for="ativo">Ativo</label>
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
  font-family: inherit;
  background: #fff !important;
  color: #1f2937 !important;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.form-input[type='color'] {
  padding: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-color-input {
  width: 60px;
  height: 60px;
  padding: 2px;
  cursor: pointer;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  transition: border-color 0.3s;
}

.form-color-input:focus {
  outline: none;
  border-color: #667eea;
}

.color-input-wrapper span {
  font-family: monospace;
  color: #666;
  font-size: 0.9rem;
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

.resources-list {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  min-height: 40px;
}

.resource-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  border-left: 3px solid #667eea;
}

.resource-item:last-child {
  margin-bottom: 0;
}

.remove-btn {
  background: #ffcdd2;
  color: #c62828;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.remove-btn:hover {
  background: #ef9a9a;
}

.resource-input {
  display: flex;
  gap: 0.5rem;
}

.resource-input .form-input {
  flex: 1;
  margin-bottom: 0;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border-left: 4px solid #c62828;
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

  .resource-input {
    flex-direction: column;
  }

  .resource-input .btn {
    width: 100%;
  }
}
</style>
