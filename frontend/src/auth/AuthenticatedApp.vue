<script setup lang="ts">
import { inject, onMounted, onUnmounted } from 'vue'
import App from '@/App.vue'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/stockinfo/client'
import { LiveEventsClient } from '@/api/data/liveEvents'
import { useLiveSyncStore } from '@/stores/liveSync'

const stockInfoClient = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!stockInfoClient) throw new Error('StockInfoClient wurde nicht bereitgestellt')

const liveSync = useLiveSyncStore()
onMounted(() => liveSync.start(new LiveEventsClient(), 30_000, stockInfoClient))
onUnmounted(() => liveSync.stop())
</script>

<template>
  <App />
</template>
