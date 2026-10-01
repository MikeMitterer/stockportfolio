<script setup lang="ts">
import { onMounted, onUnmounted, provide } from 'vue'
import App from '@/App.vue'
import { STOCK_INFO_CLIENT, StockInfoClient } from '@/api/client'
import { LiveEventsClient } from '@/data/liveEvents'
import { useLiveSyncStore } from '@/stores/liveSync'

const props = defineProps<{ baseUrl: string }>()
const stockInfoClient = new StockInfoClient(props.baseUrl)
provide(STOCK_INFO_CLIENT, stockInfoClient)

const liveSync = useLiveSyncStore()
onMounted(() => liveSync.start(new LiveEventsClient(), 30_000, stockInfoClient))
onUnmounted(() => liveSync.stop())
</script>

<template>
  <App />
</template>
