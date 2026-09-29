<script setup lang="ts">
import { provide } from 'vue'
import App from '@/App.vue'
import { STOCK_INFO_CLIENT, StockInfoClient } from '@/api/client'

const props = defineProps<{ baseUrl: string }>()
provide(STOCK_INFO_CLIENT, new StockInfoClient(props.baseUrl))
</script>

<template>
  <App />
</template>
