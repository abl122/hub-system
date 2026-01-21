<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { tenantsService } from '@/services/tenantsService'
import { plansService } from '@/services/plansService'

export interface Provider {
  _id?: string
  provedor: {
    nome: string
    razao_social?: string
    cnpj: string
    email: string
    telefone: string
    dominio: string
    admin_name?: string
    ativo?: boolean
  }
  plano_atual: string
  senha_portal?: string
  agente?: {
    url: string
    token: string
    ativo: boolean
  }
}

interface Plan {
  _id: string
  nome: string
  slug: string
  valor_mensal: number
  ativo: boolean
}

interface Props {
  isOpen: boolean
  provider?: Provider | null
  adminToken: string
}

interface Emits {
  (e: 'close'): void
  (e: 'save', provider: Provider): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const planos = ref<Plan[]>([])
const showPassword = ref(false)
const senhaOriginal = ref('')
const portalUser = ref<{ login: string; nome: string; ativo: boolean } | null>(null)

const formData = ref<Provider>({
  provedor: {
    nome: '',
    razao_social: '',
    cnpj: '',
    email: '',
    telefone: '',
    dominio: '',
    ativo: true
  },
  plano_atual: 'trial',
  senha_portal: '',
  agente: {
    url: '',
    token: '',
    ativo: false
  }
})

const title = computed(() => (props.provider ? 'Editar Provedor' : 'Novo Provedor'))

const isEditing = computed(() => !!props.provider)

const loadPlanos = async () => {
  try {
    // Se estamos editando um provider, usamos o ID dele
    // Caso contrário, carregamos todos os planos públicos
    if (props.provider?._id) {
      const response = await plansService.listTenantPlans(
        props.provider._id,
        props.adminToken,
        true
      )
      planos.value = response.plans.map(p => ({
        _id: p._id,
        nome: p.nome,
        slug: p.slug,
        valor_mensal: p.valor_mensal,
        ativo: p.ativo
      }))
    } else {
      // Para novos provedores, carregar planos gerais
      const response = await plansService.listPlans(props.adminToken, undefined, true)
      planos.value = response.plans.map(p => ({
        _id: p._id,
        nome: p.nome,
        slug: p.slug,
        valor_mensal: p.valor_mensal,
        ativo: p.ativo
      }))
    }
  } catch (error) {
    console.error('Erro ao carregar planos:', error)
    errorMessage.value = 'Erro ao carregar planos'
  }
}

// Watch para atualizar URL do agente quando domínio mudar
watch(
  () => formData.value.provedor.dominio,
  (newDominio) => {
    const d = (newDominio || '').trim()
    if (!d) return

    // Não limpar protocolo/subdomínio. Apenas remover barra final.
    const hasProtocol = /^https?:\/\//.test(d)
    const noTrailing = d.replace(/\/$/, '')

    // Se veio com protocolo, usar diretamente; senão, prefixar com provedor.
    formData.value.agente.url = hasProtocol
      ? `${noTrailing}/admin/addons/mk-edge/api.php`
      : `https://provedor.${noTrailing}/admin/addons/mk-edge/api.php`
  }
)

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal) {
      // Limpar mensagens ao abrir
      errorMessage.value = ''
      successMessage.value = ''
      
      await loadPlanos()
      if (props.provider) {
        formData.value = { ...props.provider }
        
        // Função para limpar apenas barra final
        const cleanDomain = (domain: string): string => {
          return domain.trim().replace(/\/$/, '')
        }
        
        // Limpar apenas barra final do domínio
        if (formData.value.provedor.dominio) {
          const cleanedDomain = cleanDomain(formData.value.provedor.dominio)
          formData.value.provedor.dominio = cleanedDomain
          console.log('Domínio ajustado:', cleanedDomain)
        }
        
        // Se ainda não tiver domínio, tentar extrair da URL do agente
        if (!formData.value.provedor.dominio && formData.value.agente?.url) {
          const urlMatch = formData.value.agente.url.match(/https?:\/\/(provedor\.)?([^/]+)/)
          if (urlMatch) {
            formData.value.provedor.dominio = urlMatch[2]
            console.log('Domínio extraído da URL:', formData.value.provedor.dominio)
          }
        }
        
        console.log('Dominio carregado:', formData.value.provedor.dominio)
        
        // Senha fica em users collection, não no tenant
        // Sempre limpar o campo (usuário só preenche se quer alterar a senha do portal)
        formData.value.senha_portal = ''
        senhaOriginal.value = '' // Não temos acesso à senha hasheada

        // Buscar usuário do portal para logs úteis
        try {
          const u = await tenantsService.getPortalUser(props.provider._id!, props.adminToken)
          portalUser.value = u.user || null
          if (portalUser.value) {
            console.log('PortalUser:', {
              login: portalUser.value.login,
              ativo: portalUser.value.ativo
            })
          } else {
            console.log('PortalUser: não cadastrado')
          }
        } catch (e) {
          console.log('Falha ao carregar PortalUser')
        }
      } else {
        resetForm()
        senhaOriginal.value = ''
      }
    }
  }
)

const resetForm = () => {
  formData.value = {
    provedor: {
      nome: '',
      razao_social: '',
      cnpj: '',
      email: '',
      telefone: '',
      dominio: '',
      admin_name: '',
      ativo: true
    },
    plano_atual: 'trial',
    senha_portal: '',
    agente: {
      url: '',
      token: '',
      ativo: false
    }
  }

  const handleResetPortalPassword = async () => {
    if (!props.provider?._id) return
    isLoading.value = true
    try {
      const resp = await tenantsService.resetPortalPassword(
        props.provider._id,
        { generate: true },
        props.adminToken
      )
      if (resp.success && resp.password) {
        formData.value.senha_portal = resp.password
        showPassword.value = true
        successMessage.value = 'Senha do portal resetada. Anote a nova senha.'
        setTimeout(() => (successMessage.value = ''), 3000)
      } else {
        errorMessage.value = resp.message || 'Não foi possível resetar a senha'
        setTimeout(() => (errorMessage.value = ''), 3000)
      }
    } catch (e: any) {
      errorMessage.value = e.message || 'Erro ao resetar senha'
      setTimeout(() => (errorMessage.value = ''), 3000)
    } finally {
      isLoading.value = false
    }
  }
}

const validateForm = (): boolean => {
  errorMessage.value = ''

  if (!formData.value.provedor.nome?.trim()) {
    errorMessage.value = 'Nome do provedor é obrigatório'
    return false
  }

  if (!formData.value.provedor.cnpj?.trim()) {
    errorMessage.value = 'CNPJ é obrigatório'
    return false
  }

  if (!formData.value.provedor.email?.trim()) {
    errorMessage.value = 'Email é obrigatório'
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.value.provedor.email)) {
    errorMessage.value = 'Email inválido'
    return false
  }

  if (!formData.value.provedor.dominio?.trim()) {
    errorMessage.value = 'Domínio é obrigatório'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true

  try {
    // Função para limpar apenas barra final antes de salvar
    const cleanDomainForSave = (domain: string): string => {
      return domain.trim().replace(/\/$/, '')
    }

    if (isEditing.value && props.provider?._id) {
      // Update
      const updateData: any = {
        provedor: {
          nome: formData.value.provedor.nome,
          razao_social: formData.value.provedor.razao_social,
          cnpj: formData.value.provedor.cnpj,
          email: formData.value.provedor.email,
          telefone: formData.value.provedor.telefone,
          dominio: cleanDomainForSave(formData.value.provedor.dominio),
          admin_name: formData.value.provedor.admin_name,
          ativo: formData.value.provedor.ativo ?? true
        },
        plano_atual: formData.value.plano_atual,
        agente: formData.value.agente
      }

      // Senha do portal: apenas enviar se foi preenchida (para atualizar o user portal)
      if (formData.value.senha_portal && formData.value.senha_portal.trim()) {
        updateData.senha_portal = formData.value.senha_portal
        console.log('Salvando: nova senha do portal será atualizada no user')
      } else {
        console.log('Senha não alterada: campo vazio, mantém senha atual do user portal')
      }

      console.log('Dados a atualizar no tenant:', updateData)

      console.log('🔍 DETALHES DOS DADOS ENVIADOS:')
      console.log('   Nome:', updateData.provedor.nome)
      console.log('   Domínio:', updateData.provedor.dominio)
      console.log('   Admin Name:', updateData.provedor.admin_name)
      console.log('   Senha Portal:', updateData.senha_portal ? '***fornecida***' : 'NÃO')
      console.log('   Ativo:', updateData.provedor.ativo)

      const response = await tenantsService.updateTenant(
        props.provider._id,
        updateData,
        props.adminToken
      )

      if (response.success) {
        successMessage.value = 'Provedor atualizado com sucesso!'
        setTimeout(() => {
          successMessage.value = ''
          emit('save', formData.value)
          emit('close')
        }, 1500)
      } else {
        errorMessage.value = response.message || 'Erro ao atualizar provedor'
      }
    } else {
      // Create
      const createData: any = {
        provedor: {
          nome: formData.value.provedor.nome,
          razao_social: formData.value.provedor.razao_social,
          cnpj: formData.value.provedor.cnpj,
          email: formData.value.provedor.email,
          telefone: formData.value.provedor.telefone,
          dominio: cleanDomainForSave(formData.value.provedor.dominio),
          admin_name: formData.value.provedor.admin_name,
          ativo: formData.value.provedor.ativo
        },
        plano_atual: formData.value.plano_atual,
        agente: formData.value.agente || {
          url: '',
          token: '',
          ativo: false
        }
      }

      // Senha é obrigatória na criação
      if (formData.value.senha_portal && formData.value.senha_portal.trim()) {
        createData.senha_portal = formData.value.senha_portal
      }

      const response = await tenantsService.createTenant(
        createData,
        props.adminToken
      )

      if (response.success) {
        successMessage.value = 'Provedor criado com sucesso!'
        setTimeout(() => {
          successMessage.value = ''
          emit('save', formData.value)
          emit('close')
        }, 1500)
      } else {
        errorMessage.value = response.message || 'Erro ao criar provedor'
      }
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Erro ao salvar provedor'
    successMessage.value = ''
  } finally {
    isLoading.value = false
  }
}

const handleClose = () => {
  resetForm()
  errorMessage.value = ''
  successMessage.value = ''
  senhaOriginal.value = ''
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
        <div v-if="successMessage" class="success-message">
          ✓ {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="error-message">
          ✗ {{ errorMessage }}
        </div>

        <div class="form-section">
          <h4>Informações do Provedor</h4>

          <div class="form-group">
            <label for="nome">Nome do Provedor *</label>
            <input
              id="nome"
              v-model="formData.provedor.nome"
              type="text"
              placeholder="Ex: MK-Edge Tecnologia"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="razao-social">Razão Social</label>
            <input
              id="razao-social"
              v-model="formData.provedor.razao_social"
              type="text"
              placeholder="Ex: MK-Edge Tecnologia LTDA"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="cnpj">CNPJ *</label>
              <input
                id="cnpj"
                v-model="formData.provedor.cnpj"
                type="text"
                placeholder="00.000.000/0000-00"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input
                id="email"
                v-model="formData.provedor.email"
                type="email"
                placeholder="admin@provedor.com.br"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="telefone">Telefone</label>
              <input
                id="telefone"
                v-model="formData.provedor.telefone"
                type="text"
                placeholder="(11) 3000-0000"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="admin-name">Responsável</label>
              <input
                id="admin-name"
                v-model="formData.provedor.admin_name"
                type="text"
                placeholder="Nome completo do responsável"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="senha-portal">Senha do Portal</label>
              <input
                id="senha-portal"
                v-model="formData.senha_portal"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Senha não exibida; deixe vazio para manter"
                class="form-input"
              />
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="showPassword"
                />
                Mostrar senha
              </label>
              <button type="button" class="btn btn-secondary" @click="handleResetPortalPassword" v-if="isEditing">
                Resetar e mostrar nova senha
              </button>
            </div>

            <div class="form-group">
              <label for="dominio">Domínio *</label>
              <input
                id="dominio"
                v-model="formData.provedor.dominio"
                type="text"
                placeholder="provedor.com.br"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="agente-url">URL do Agente</label>
            <input
              id="agente-url"
              v-model="formData.agente.url"
              type="text"
              class="form-input"
              placeholder="https://provedor.com.br/admin/addons/mk-edge/api.php"
            />
            <small class="form-hint">
              Gerada automaticamente, mas pode ser editada manualmente.
            </small>
          </div>
        </div>

        <div class="form-section">
          <h4>Plano e Status</h4>

          <div class="form-row">
            <div class="form-group">
              <label for="plano">Plano Atual *</label>
              <select id="plano" v-model="formData.plano_atual" class="form-input">
                <option value="" disabled>Selecione um plano</option>
                <option
                  v-for="plano in planos"
                  :key="plano._id"
                  :value="plano.slug"
                >
                  {{ plano.nome }} (R$ {{ plano.valor_mensal.toFixed(2).replace('.', ',') }})
                </option>
              </select>
              <small class="form-hint">
                O plano pode ser alterado aqui. As datas e valores ficam na gestão de assinaturas.
              </small>
            </div>

            <div class="form-group checkbox">
              <input
                id="provedor-ativo"
                v-model="formData.provedor.ativo"
                type="checkbox"
                class="form-checkbox"
              />
              <label for="provedor-ativo">Provedor Ativo</label>
              <small class="form-hint">
                Desmarque para desativar completamente o acesso do provedor ao sistema.
              </small>
            </div>
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
}

.color-input-wrapper span {
  font-family: monospace;
  color: #666;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  cursor: pointer;
  font-size: 0.95rem;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.form-hint {
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

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 0.85em;
  color: #666;
  font-style: italic;
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
