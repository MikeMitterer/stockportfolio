<script setup lang="ts">
/**
 * Anmeldung mit dem Hinweis zu Anlageentscheidungen.
 *
 * Der Knopf bleibt gesperrt, bis der Hinweis bestätigt ist. Enter im Formular
 * umgeht den gesperrten Knopf; deshalb prüft auch `AuthRoot.vue` beim Absenden.
 */
import { useI18n } from 'vue-i18n'
import { NButton, NCheckbox, NFormItem, NInput } from 'naive-ui'
import EmphasizedText from '@/components/EmphasizedText.vue'

defineProps<{ busy: boolean }>()
const emit = defineEmits<{ submit: [] }>()
const username = defineModel<string>('username', { required: true })
const password = defineModel<string>('password', { required: true })
const noticeAccepted = defineModel<boolean>('noticeAccepted', { required: true })

const { t } = useI18n()
</script>

<template>
  <form class="auth-login" @submit.prevent="emit('submit')">
    <!--
      Mobil steht der Hinweis unter den Eingabefeldern, ab `md` daneben.
      Haken und Knopf folgen immer darunter über die ganze Breite.
    -->
    <div class="auth-login__fields">
      <NFormItem :label="t('auth.username')"
        ><NInput
          v-model:value="username"
          :input-props="{ 'aria-label': t('auth.username') }"
          autocomplete="username"
      /></NFormItem>
      <NFormItem :label="t('auth.password')"
        ><NInput
          v-model:value="password"
          :input-props="{ 'aria-label': t('auth.password') }"
          type="password"
          show-password-on="click"
          autocomplete="current-password"
      /></NFormItem>
    </div>
    <div id="auth-investment-notice" class="auth-login__notice">
      <EmphasizedText :text="t('auth.investmentNotice')" />
    </div>
    <div class="auth-login__confirm">
      <NCheckbox v-model:checked="noticeAccepted" aria-describedby="auth-investment-notice">{{
        t('auth.investmentConfirm')
      }}</NCheckbox>
    </div>
    <div class="auth-login__action">
      <NButton type="primary" attr-type="submit" :loading="busy" :disabled="!noticeAccepted">{{
        t('auth.login')
      }}</NButton>
    </div>
  </form>
</template>

<style scoped lang="scss">
.auth-login {
  display: grid;
  grid-template-areas: 'fields' 'notice' 'confirm' 'action';

  @include up(md) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas: 'fields notice' 'confirm confirm' 'action action';
    column-gap: var(--space-8);
    align-items: start;
  }

  &__fields {
    grid-area: fields;
  }
  &__notice {
    grid-area: notice;
    margin: 0 0 var(--space-3);
    padding: var(--space-3) var(--space-4);
    // Dezent: Der Strich gliedert, er soll nicht mit dem Text konkurrieren.
    border-left: 2px solid rgb(var(--border-subtle));
    color: rgb(var(--text-secondary));
    font-size: 0.8125rem;

    // Neben den Feldern beginnt der Hinweis auf Höhe der ersten Beschriftung.
    @include up(md) {
      margin: 0 0 var(--space-6);
    }
  }
  &__confirm {
    grid-area: confirm;
    margin-bottom: var(--space-4);
  }
  &__action {
    grid-area: action;
  }
}
</style>
