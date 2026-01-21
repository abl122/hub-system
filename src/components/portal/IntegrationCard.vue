<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  icon: string
  status: 'connected' | 'disconnected' | 'error'
  description: string
  details?: Record<string, any>
  actionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  actionLabel: 'Configurar'
})

const emit = defineEmits<{
  configure: []
  test: []
}>()

const statusColor = computed(() => {
  switch (props.status) {
    case 'connected':
      return '#10b981'
    case 'disconnected':
      return '#6b7280'
    case 'error':
      return '#ef4444'
  }
})

const statusLabel = computed(() => {
  switch (props.status) {
    case 'connected':
      return 'Conectado'
    case 'disconnected':
      return 'Desconectado'
    case 'error':
      return 'Erro'
  }
})

const statusIcon = computed(() => {
  switch (props.status) {
    case 'connected':
      return '✓'
    case 'disconnected':
      return '○'
    case 'error':
      return '✕'
  }
})
</script>

<template>
  <div class="integration-card">
    <div class="card-header">
      <div class="header-left">
        <span class="integration-icon">{{ icon }}</span>
        <div class="header-info">
          <h3 class="title">{{ title }}</h3>
          <p class="description">{{ description }}</p>
        </div>
      </div>
      <div class="status-badge" :style="{ borderColor: statusColor, backgroundColor: statusColor + '15' }">
        <span class="status-icon" :style="{ color: statusColor }">{{ statusIcon }}</span>
        <span class="status-label" :style="{ color: statusColor }">{{ statusLabel }}</span>
      </div>
    </div>

    <div v-if="details && Object.keys(details).length > 0" class="card-details">
      <div v-for="(value, key) in details" :key="key" class="detail-item">
        <span class="detail-label">{{ key }}:</span>
        <span class="detail-value">{{ value }}</span>
      </div>
    </div>

    <div class="card-actions">
      <button class="btn-primary" @click="$emit('configure')">{{ actionLabel }}</button>
      <button class="btn-secondary" @click="$emit('test')">Testar</button>
    </div>
  </div>
</template>

<style scoped>
.integration-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.integration-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.header-left {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.integration-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.header-info {
  flex: 1;
}

.title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.description {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid;
  border-radius: 6px;
  white-space: nowrap;
}

.status-icon {
  font-weight: bold;
}

.status-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.card-details {
  background: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: grid;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.detail-label {
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  color: #1f2937;
  font-family: 'Monaco', 'Courier New', monospace;
  word-break: break-all;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}

.btn-primary,
.btn-secondary {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  flex: 1;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
