<script setup lang="ts">
/** Pflichtwechsel des Passworts nach der ersten Anmeldung; Abmelden bleibt möglich. */
import { useI18n } from 'vue-i18n'
import { NButton, NSpace } from 'naive-ui'
import NewPasswordField from './NewPasswordField.vue'

defineProps<{ busy: boolean }>()
const emit = defineEmits<{ submit: []; logout: [] }>()
const newPassword = defineModel<string>({ required: true })

const { t } = useI18n()
</script>

<template>
  <form @submit.prevent="emit('submit')">
    <NewPasswordField v-model="newPassword" :label="t('auth.newPassword')" />
    <NSpace
      ><NButton type="primary" attr-type="submit" :loading="busy">{{
        t('auth.changePassword')
      }}</NButton
      ><NButton :disabled="busy" @click="emit('logout')">{{ t('auth.logout') }}</NButton></NSpace
    >
  </form>
</template>
