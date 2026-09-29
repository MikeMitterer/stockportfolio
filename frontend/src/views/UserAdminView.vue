<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NButton, NCard, NFormItem, NInput, NPopconfirm, NSelect, NSpace } from 'naive-ui'
import { AUTH_CLIENT } from '@/auth/context'
import { PortfolioApiError, type PortfolioAuthClient, type PortfolioUser } from '@/auth/client'

const injectedClient = inject(AUTH_CLIENT)
if (!injectedClient) throw new Error('PortfolioAuthClient wurde nicht bereitgestellt')
const client: PortfolioAuthClient = injectedClient

const { t, te } = useI18n()
const router = useRouter()
const users = ref<PortfolioUser[]>([])
const loading = ref(false)
const busy = ref(false)
const errorCode = ref('')
const newUsername = ref('')
const newPassword = ref('')
const newRole = ref<'admin' | 'user'>('user')
const resetPasswords = reactive<Record<string, string>>({})
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

onMounted(() => { void loadUsers() })
</script>

<template>
  <div class="user-admin">
    <header class="user-admin__header">
      <div>
        <h1>{{ t('auth.usersTitle') }}</h1>
        <p>{{ t('auth.usersHint') }}</p>
      </div>
      <NButton @click="router.push({ path: '/settings', query: { tab: 'users' } })">{{ t('auth.backToSettings') }}</NButton>
    </header>

    <NCard :title="t('auth.createUserTitle')">
      <form @submit.prevent="createUser">
        <div class="user-admin__form">
          <NFormItem :label="t('auth.username')"><NInput v-model:value="newUsername" :input-props="{ 'aria-label': t('auth.username') }" autocomplete="off" /></NFormItem>
          <NFormItem :label="t('auth.temporaryPassword')"><NInput v-model:value="newPassword" :input-props="{ 'aria-label': t('auth.temporaryPassword') }" type="password" show-password-on="click" autocomplete="new-password" /></NFormItem>
          <NFormItem :label="t('auth.role')"><NSelect v-model:value="newRole" :input-props="{ 'aria-label': t('auth.role') }" :options="roleOptions" /></NFormItem>
        </div>
        <NButton type="primary" attr-type="submit" :loading="busy">{{ t('auth.createUser') }}</NButton>
      </form>
    </NCard>

    <p v-if="errorMessage" role="alert" class="user-admin__error">{{ errorMessage }}</p>
    <p v-if="loading" role="status">{{ t('auth.loadingUsers') }}</p>
    <div v-else class="user-admin__list">
      <NCard v-for="account in users" :key="account.id" :title="account.username">
        <p>{{ t(account.role === 'admin' ? 'auth.adminRole' : 'auth.userRole') }} · {{ t(account.active ? 'auth.active' : 'auth.inactive') }}</p>
        <p v-if="account.mustChangePassword">{{ t('auth.passwordChangePending') }}</p>
        <NSpace v-if="account.active" vertical>
          <NFormItem :label="t('auth.temporaryPassword')">
            <NInput v-model:value="resetPasswords[account.id]" :input-props="{ 'aria-label': `${t('auth.temporaryPassword')}: ${account.username}` }" type="password" show-password-on="click" autocomplete="new-password" />
          </NFormItem>
          <NSpace>
            <NButton :disabled="busy || !resetPasswords[account.id]" @click="resetPassword(account)">{{ t('auth.resetPassword') }}</NButton>
            <NPopconfirm @positive-click="deactivateUser(account)">
              <template #trigger><NButton type="warning" :disabled="busy">{{ t('auth.deactivate') }}</NButton></template>
              {{ t('auth.deactivateConfirm', { username: account.username }) }}
            </NPopconfirm>
          </NSpace>
        </NSpace>
      </NCard>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-admin { width: min(100%, 70rem); margin-inline: auto; display: grid; gap: 1rem; }
.user-admin__header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: start; gap: 1rem; }
.user-admin__header h1 { margin: 0; }
.user-admin__header p { margin-bottom: 0; }
.user-admin__form { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr)); gap: 1rem; }
.user-admin__list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); gap: 1rem; }
.user-admin__error { color: var(--n-color-error, #c93737); }
@media (max-width: 600px) {
  .user-admin { padding-inline: 1rem; }
}
</style>
