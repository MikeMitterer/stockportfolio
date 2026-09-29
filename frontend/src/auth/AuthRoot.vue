<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NCard, NConfigProvider, NFormItem, NInput, NSpace, darkTheme, deDE, enUS } from 'naive-ui'
import { THEMES } from '@mmit/ux-foundation'
import { apiBaseUrl, MissingApiUrlError } from '@/api/client'
import { readStoredTheme } from '@/stores/theme'
import AuthenticatedApp from './AuthenticatedApp.vue'
import { PortfolioAuthClient, PortfolioApiError, type PortfolioUser } from './client'
import { AUTH_CLIENT, AUTH_LOGOUT, AUTH_USER } from './context'

type View = 'loading' | 'setup' | 'login' | 'change' | 'app' | 'pending' | 'missingStockInfo' | 'unavailable'

const { t, te, locale } = useI18n()
const client = new PortfolioAuthClient()
const user = ref<PortfolioUser | null>(null)
const view = ref<View>('loading')
const busy = ref(false)
const errorCode = ref('')
const setupCode = ref('')
const username = ref('')
const password = ref('')
const newPassword = ref('')
const baseUrl = ref('')
const isDark = THEMES[readStoredTheme()].isDark

provide(AUTH_CLIENT, client)
provide(AUTH_USER, user)
provide(AUTH_LOGOUT, logout)

const errorMessage = computed(() => {
  if (!errorCode.value) return ''
  const key = `auth.errors.${errorCode.value}`
  return te(key) ? t(key) : t('auth.errors.request_failed')
})

function acceptUser(nextUser: PortfolioUser): void {
  user.value = nextUser
  errorCode.value = ''
  if (nextUser.mustChangePassword) {
    view.value = 'change'
  } else if (nextUser.role !== 'admin') {
    view.value = 'pending'
  } else {
    try {
      baseUrl.value = apiBaseUrl()
      view.value = 'app'
    } catch (error) {
      if (!(error instanceof MissingApiUrlError)) throw error
      view.value = 'missingStockInfo'
    }
  }
}

function reportError(error: unknown): void {
  errorCode.value = error instanceof PortfolioApiError ? error.code : 'request_failed'
}

async function initialize(): Promise<void> {
  view.value = 'loading'
  try {
    const setup = await client.setupStatus()
    if (setup.required) {
      view.value = 'setup'
      return
    }
    const session = await client.session()
    if (session) acceptUser(session)
    else view.value = 'login'
  } catch (error) {
    console.error('StockPortfolio auth initialization failed', error)
    view.value = 'unavailable'
  }
}

async function submitSetup(): Promise<void> {
  busy.value = true
  errorCode.value = ''
  try {
    await client.setup(setupCode.value, username.value, password.value)
    acceptUser((await client.login(username.value, password.value)).user)
    setupCode.value = ''
    password.value = ''
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

async function submitLogin(): Promise<void> {
  busy.value = true
  errorCode.value = ''
  try {
    acceptUser((await client.login(username.value, password.value)).user)
    password.value = ''
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

async function submitPassword(): Promise<void> {
  busy.value = true
  errorCode.value = ''
  try {
    acceptUser((await client.changePassword(newPassword.value)).user)
    newPassword.value = ''
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

async function logout(): Promise<void> {
  busy.value = true
  try {
    await client.logout()
    user.value = null
    view.value = 'login'
    errorCode.value = ''
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

onMounted(() => { void initialize() })
</script>

<template>
  <NConfigProvider :locale="locale === 'de' ? deDE : enUS" :theme="isDark ? darkTheme : null">
    <AuthenticatedApp v-if="view === 'app'" :base-url="baseUrl" />
    <main v-else class="auth-page" :class="{ 'auth-page--pending': view === 'pending' }">
      <NCard class="auth-panel" :title="t('app.title')">
        <p v-if="view === 'loading'" role="status">{{ t('auth.loading') }}</p>
        <template v-else-if="view === 'setup'">
          <h1>{{ t('auth.setupTitle') }}</h1>
          <p>{{ t('auth.setupHint') }}</p>
          <form @submit.prevent="submitSetup">
            <NFormItem :label="t('auth.setupCode')"><NInput v-model:value="setupCode" :input-props="{ 'aria-label': t('auth.setupCode') }" autocomplete="one-time-code" /></NFormItem>
            <NFormItem :label="t('auth.username')"><NInput v-model:value="username" :input-props="{ 'aria-label': t('auth.username') }" autocomplete="username" /></NFormItem>
            <NFormItem :label="t('auth.password')"><NInput v-model:value="password" :input-props="{ 'aria-label': t('auth.password') }" type="password" show-password-on="click" autocomplete="new-password" /></NFormItem>
            <NButton type="primary" attr-type="submit" :loading="busy">{{ t('auth.createAdmin') }}</NButton>
          </form>
        </template>
        <template v-else-if="view === 'login'">
          <h1>{{ t('auth.loginTitle') }}</h1>
          <form @submit.prevent="submitLogin">
            <NFormItem :label="t('auth.username')"><NInput v-model:value="username" :input-props="{ 'aria-label': t('auth.username') }" autocomplete="username" /></NFormItem>
            <NFormItem :label="t('auth.password')"><NInput v-model:value="password" :input-props="{ 'aria-label': t('auth.password') }" type="password" show-password-on="click" autocomplete="current-password" /></NFormItem>
            <NButton type="primary" attr-type="submit" :loading="busy">{{ t('auth.login') }}</NButton>
          </form>
        </template>
        <template v-else-if="view === 'change'">
          <h1>{{ t('auth.changeTitle') }}</h1>
          <p>{{ t('auth.changeHint') }}</p>
          <form @submit.prevent="submitPassword">
            <NFormItem :label="t('auth.newPassword')"><NInput v-model:value="newPassword" :input-props="{ 'aria-label': t('auth.newPassword') }" type="password" show-password-on="click" autocomplete="new-password" /></NFormItem>
            <NSpace><NButton type="primary" attr-type="submit" :loading="busy">{{ t('auth.changePassword') }}</NButton><NButton :disabled="busy" @click="logout">{{ t('auth.logout') }}</NButton></NSpace>
          </form>
        </template>
        <template v-else-if="view === 'pending'">
          <h1>{{ t('auth.pendingTitle') }}</h1>
          <p>{{ t('auth.pendingHint') }}</p>
          <div class="auth-actions"><NButton :disabled="busy" @click="logout">{{ t('auth.logout') }}</NButton></div>
        </template>
        <template v-else-if="view === 'missingStockInfo'">
          <h1>{{ t('startup.noApiUrlTitle') }}</h1>
          <p>{{ t('startup.noApiUrlBody') }}</p>
          <div class="auth-actions"><NButton :disabled="busy" @click="logout">{{ t('auth.logout') }}</NButton></div>
        </template>
        <template v-else>
          <h1>{{ t('auth.unavailableTitle') }}</h1>
          <p>{{ t('auth.unavailableHint') }}</p>
          <div class="auth-actions"><NButton @click="initialize">{{ t('auth.retry') }}</NButton></div>
        </template>
        <p v-if="errorMessage" role="alert" class="auth-error">{{ errorMessage }}</p>
      </NCard>
    </main>
  </NConfigProvider>
</template>

<style scoped lang="scss">
.auth-page { min-height: 100vh; display: grid; place-items: center; padding: 1rem; }
.auth-page--pending { padding-bottom: calc(1rem + 8vh); }
.auth-panel { width: min(100%, 32rem); }
.auth-panel h1 { font-size: 1.4rem; margin: 0 0 1rem; }
.auth-panel p { line-height: 1.5; }
.auth-actions { margin-top: 1.25rem; }
.auth-error { color: var(--n-color-error, #c93737); margin-top: 1rem; }
</style>
