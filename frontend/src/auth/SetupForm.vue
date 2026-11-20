<script setup lang="ts">
/** Ersteinrichtung: Einrichtungscode und das erste Konto mit Administratorrechten. */
import { useI18n } from 'vue-i18n'
import { NButton, NFormItem, NInput } from 'naive-ui'
import { UxInfoHint } from '@mmit/ux-foundation'
import NewPasswordField from './NewPasswordField.vue'

defineProps<{ busy: boolean }>()
const emit = defineEmits<{ submit: [] }>()
const setupCode = defineModel<string>('setupCode', { required: true })
const username = defineModel<string>('username', { required: true })
const password = defineModel<string>('password', { required: true })

const { t } = useI18n()
</script>

<template>
  <form @submit.prevent="emit('submit')">
    <NFormItem>
      <template #label>
        <span class="auth-panel__field-label"
          >{{ t('auth.setupCode') }} <UxInfoHint :text="t('auth.setupCodeHelp')"
        /></span>
      </template>
      <NInput
        v-model:value="setupCode"
        :input-props="{ 'aria-label': t('auth.setupCode') }"
        autocomplete="one-time-code"
      />
    </NFormItem>
    <NFormItem :label="t('auth.username')"
      ><NInput
        v-model:value="username"
        :input-props="{ 'aria-label': t('auth.username') }"
        autocomplete="username"
    /></NFormItem>
    <NewPasswordField v-model="password" :label="t('auth.password')" />
    <NButton type="primary" attr-type="submit" :loading="busy">{{ t('auth.createAdmin') }}</NButton>
  </form>
</template>

<style scoped lang="scss">
/* Klassenname wie früher in `AuthRoot.vue`: `setup-dialog-check.mjs` sucht ihn. */
.auth-panel__field-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
</style>
