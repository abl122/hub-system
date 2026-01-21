<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label: string
  value: string | number
  icon?: string
  highlight?: boolean
}

withDefaults(defineProps<Props>(), {
  highlight: false
})
</script>

<template>
  <div class="info-item" :class="{ highlight }">
    <div class="info-header">
      <span v-if="icon" class="info-icon">{{ icon }}</span>
      <label class="info-label">{{ label }}</label>
    </div>
    <div class="info-value">{{ value }}</div>
  </div>
</template>

<style scoped>
.info-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.info-item:hover {
  border-color: #d1d5db;
}

.info-item.highlight {
  border-color: #3b82f6;
  background: #eff6ff;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.info-icon {
  font-size: 1.25rem;
}

.info-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
  margin: 0;
}

.info-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  word-break: break-word;
}

.info-item.highlight .info-value {
  color: #1e40af;
}
</style>
