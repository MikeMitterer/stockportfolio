<script setup lang="ts">
/**
 * Feld für ein neues Passwort samt Anforderungen darunter.
 *
 * Einrichtung und Passwortänderung zeigen dieselben Anforderungen; das Feld
 * verweist per `aria-describedby` auf sie.
 */
import { useI18n } from 'vue-i18n'
import { NFormItem, NInput } from 'naive-ui'

defineProps<{
  /** Beschriftung und zugleich zugänglicher Name des Felds. */
  label: string
}>()
const password = defineModel<string>({ required: true })

const { t } = useI18n()
</script>

<template>
  <div class="new-password">
    <NFormItem :label="label" :show-feedback="false"
      ><NInput
        v-model:value="password"
        :input-props="{
          'aria-label': label,
          'aria-describedby': 'auth-password-requirements',
        }"
        type="password"
        show-password-on="click"
        autocomplete="new-password"
    /></NFormItem>
    <p id="auth-password-requirements" class="new-password__hint">
      {{ t('auth.passwordRequirements') }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.new-password {
  margin-bottom: var(--space-4);

  &__hint {
    margin: 0;
    color: rgb(var(--text-secondary));
    font-size: 0.8125rem;
    line-height: 1.5;
  }
}
</style>
