<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NFormItem, NInput, NPopconfirm, NSelect, NSpace } from 'naive-ui'
import { UxInfoHint } from '@mmit/ux-foundation'
import { AUTH_CLIENT, AUTH_USER } from '@/auth/context'
import { PortfolioApiError, type PortfolioAuthClient, type PortfolioUser } from '@/api/account/client'

const injectedClient = inject(AUTH_CLIENT)
if (!injectedClient) throw new Error('PortfolioAuthClient wurde nicht bereitgestellt')
const client: PortfolioAuthClient = injectedClient

const { t, te } = useI18n()
const authenticatedUser = inject(AUTH_USER)
const currentUserId = computed(() => authenticatedUser?.value?.id ?? null)
const users = ref<PortfolioUser[]>([])
const loading = ref(false)
const busy = ref(false)
const errorCode = ref('')
const newUsername = ref('')
const newPassword = ref('')
const newRole = ref<'admin' | 'user'>('user')
const resetPasswords = reactive<Record<string, string>>({})
const resetAccountId = ref<string | null>(null)
const roleOptions = computed(() => [
  { label: t('auth.userRole'), value: 'user' },
  { label: t('auth.adminRole'), value: 'admin' },
])
const errorMessage = computed(() => {
  if (!errorCode.value) return ''
  const key = `auth.errors.${errorCode.value}`
  return te(key) ? t(key) : t('auth.errors.request_failed')
})

function reportError(error: unknown): void {
  errorCode.value = error instanceof PortfolioApiError ? error.code : 'request_failed'
}

async function loadUsers(): Promise<void> {
  loading.value = true
  errorCode.value = ''
  try {
    users.value = (await client.listUsers()).users
  } catch (error) {
    reportError(error)
  } finally {
    loading.value = false
  }
}

async function createUser(): Promise<void> {
  busy.value = true
  errorCode.value = ''
  try {
    await client.createUser(newUsername.value, newPassword.value, newRole.value)
    newUsername.value = ''
    newPassword.value = ''
    await loadUsers()
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

async function resetPassword(user: PortfolioUser): Promise<void> {
  busy.value = true
  errorCode.value = ''
  try {
    await client.resetPassword(user.id, resetPasswords[user.id] ?? '')
    resetPasswords[user.id] = ''
    resetAccountId.value = null
    await loadUsers()
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

async function deactivateUser(user: PortfolioUser): Promise<void> {
  busy.value = true
  errorCode.value = ''
  try {
    await client.deactivateUser(user.id)
    await loadUsers()
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

async function reactivateUser(user: PortfolioUser): Promise<void> {
  busy.value = true
  errorCode.value = ''
  try {
    await client.reactivateUser(user.id)
    await loadUsers()
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

onMounted(() => { void loadUsers() })
</script>

<template>
  <div class="user-admin">
    <header class="user-admin__header">
      <div>
        <h1>{{ t('auth.usersTitle') }}</h1>
        <p>{{ t('auth.usersHint') }}</p>
      </div>
    </header>

    <section class="user-admin__card">
      <h2 class="user-admin__card-title">{{ t('auth.createUserTitle') }}</h2>
      <p class="user-admin__card-intro">{{ t('auth.createUserHint') }}</p>
      <form @submit.prevent="createUser">
        <div class="user-admin__form">
          <NFormItem :label="t('auth.username')"><NInput v-model:value="newUsername" :input-props="{ 'aria-label': t('auth.username') }" autocomplete="off" /></NFormItem>
          <div>
            <NFormItem :show-feedback="false">
              <template #label><span class="user-admin__field-label">{{ t('auth.temporaryPassword') }} <UxInfoHint :text="t('auth.temporaryPasswordHelp')" /></span></template>
              <NInput v-model:value="newPassword" :input-props="{ 'aria-label': t('auth.temporaryPassword'), 'aria-describedby': 'create-password-requirements' }" type="password" show-password-on="click" autocomplete="new-password" />
            </NFormItem>
            <p id="create-password-requirements" class="user-admin__field-hint">{{ t('auth.passwordRequirements') }}</p>
          </div>
          <NFormItem :label="t('auth.role')"><NSelect v-model:value="newRole" :input-props="{ 'aria-label': t('auth.role') }" :options="roleOptions" /></NFormItem>
        </div>
        <NButton type="primary" attr-type="submit" :loading="busy">{{ t('auth.createUser') }}</NButton>
      </form>
    </section>

    <p v-if="errorMessage" role="alert" class="user-admin__error">{{ errorMessage }}</p>
    <p v-if="loading" role="status">{{ t('auth.loadingUsers') }}</p>
    <section v-else class="user-admin__accounts">
      <h2 class="user-admin__section-title">{{ t('auth.accountsTitle') }}</h2>
      <ul class="user-admin__list">
        <li v-for="account in users" :key="account.id" class="user-admin__account">
          <div class="user-admin__account-row">
            <div>
              <h3 class="user-admin__account-name">{{ account.username }}</h3>
              <p class="user-admin__account-meta">
                <span>{{ t(account.role === 'admin' ? 'auth.adminRole' : 'auth.userRole') }}</span>
                <span class="user-admin__status" :class="{ 'user-admin__status--inactive': !account.active }">{{ t(account.active ? 'auth.active' : 'auth.inactive') }}</span>
                <span v-if="account.id === currentUserId">{{ t('auth.yourAccount') }}</span>
                <span v-if="account.mustChangePassword">{{ t('auth.passwordChangePending') }}</span>
              </p>
            </div>
            <NSpace v-if="account.active && account.id !== currentUserId" class="user-admin__account-buttons">
              <NButton size="small" secondary :disabled="busy" :aria-expanded="resetAccountId === account.id" :aria-controls="`reset-account-${account.id}`" @click="resetAccountId = resetAccountId === account.id ? null : account.id">{{ t('auth.resetPassword') }}</NButton>
              <NPopconfirm @positive-click="deactivateUser(account)">
                <template #trigger><NButton size="small" type="warning" secondary :disabled="busy">{{ t('auth.deactivate') }}</NButton></template>
                {{ t('auth.deactivateConfirm', { username: account.username }) }}
              </NPopconfirm>
            </NSpace>
            <NButton v-else-if="!account.active" size="small" secondary :disabled="busy" @click="reactivateUser(account)">{{ t('auth.reactivate') }}</NButton>
          </div>
          <form v-if="resetAccountId === account.id" :id="`reset-account-${account.id}`" class="user-admin__reset-form" @submit.prevent="resetPassword(account)">
            <NFormItem :show-feedback="false">
              <template #label><span class="user-admin__field-label">{{ t('auth.temporaryPassword') }} <UxInfoHint :text="t('auth.temporaryPasswordHelp')" /></span></template>
              <NInput v-model:value="resetPasswords[account.id]" :input-props="{ 'aria-label': `${t('auth.temporaryPassword')}: ${account.username}`, 'aria-describedby': `reset-password-requirements-${account.id}` }" type="password" show-password-on="click" autocomplete="new-password" />
            </NFormItem>
            <p :id="`reset-password-requirements-${account.id}`" class="user-admin__field-hint">{{ t('auth.passwordRequirements') }}</p>
            <NSpace>
              <NButton type="primary" attr-type="submit" :disabled="busy || !resetPasswords[account.id]">{{ t('auth.saveTemporaryPassword') }}</NButton>
              <NButton :disabled="busy" @click="resetAccountId = null">{{ t('actions.cancel') }}</NButton>
            </NSpace>
          </form>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
.user-admin {
  @include content-frame(var(--space-8));
  display: grid;
  gap: var(--space-8);

  &__header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: start;
    gap: var(--space-4);
    h1 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 600;
    }
    p { margin: var(--space-2) 0 0; color: rgb(var(--text-secondary)); }
  }

  &__card {
    @include card-surface;
    padding: var(--space-6);
    box-shadow: var(--shadow-sm);
  }
  &__card-title { margin: 0; font-family: var(--font-display); font-size: 1.25rem; }
  &__card-intro { margin: var(--space-2) 0 var(--space-6); color: rgb(var(--text-secondary)); }
  &__field-label { display: inline-flex; align-items: center; gap: var(--space-2); }
  &__field-hint { margin: 0 0 var(--space-4); color: rgb(var(--text-secondary)); font-size: 0.8125rem; }
  &__form { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr)); align-items: start; gap: var(--space-4); }
  &__section-title { margin: 0 0 var(--space-4); font-family: var(--font-display); font-size: 1.25rem; }
  &__list {
    @include card-surface;
    margin: 0;
    padding: 0;
    list-style: none;
    box-shadow: var(--shadow-sm);
  }
  &__account { padding: var(--space-4) var(--space-6); }
  &__account + &__account { border-top: 1px solid rgb(var(--border-subtle)); }
  &__account-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); }
  &__account-name { margin: 0; font-family: var(--font-display); font-size: 1rem; }
  &__account-meta { display: flex; flex-wrap: wrap; gap: var(--space-3); margin: var(--space-1) 0 0; color: rgb(var(--text-secondary)); font-size: 0.8125rem; }
  &__account-buttons { flex-wrap: wrap; }
  &__status { color: rgb(var(--status-ok)); }
  &__status--inactive { color: rgb(var(--text-muted)); }
  &__reset-form { max-width: 28rem; margin-top: var(--space-4); }
  &__error { color: rgb(var(--status-out)); }
}

</style>
