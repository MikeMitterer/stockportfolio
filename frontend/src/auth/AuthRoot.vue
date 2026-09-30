<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NButton, NConfigProvider, NFormItem, NInput, NSpace, darkTheme, deDE, enUS, type GlobalThemeOverrides } from 'naive-ui'
import { buildNaiveOverrides, THEMES, UxInfoHint } from '@mmit/ux-foundation'
import { apiBaseUrl, MissingApiUrlError } from '@/api/client'
import { readStoredTheme } from '@/stores/theme'
import AuthenticatedApp from './AuthenticatedApp.vue'
import { PortfolioAuthClient, PortfolioApiError, type PortfolioUser } from './client'
import { AUTH_CLIENT, AUTH_LOGOUT, AUTH_USER } from './context'

type View = 'loading' | 'setup' | 'login' | 'change' | 'app' | 'pending' | 'missingStockInfo' | 'unavailable'

const { t, te, locale } = useI18n()
const router = useRouter()
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
const naiveOverrides = ref<GlobalThemeOverrides>({})

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
    void router.replace({ name: 'dashboard' })
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
    void router.replace({ name: 'dashboard' })
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  naiveOverrides.value = buildNaiveOverrides()
  void initialize()
})
</script>

<template>
  <NConfigProvider :locale="locale === 'de' ? deDE : enUS" :theme="isDark ? darkTheme : null" :theme-overrides="naiveOverrides" inline-theme-disabled>
    <AuthenticatedApp v-if="view === 'app'" :base-url="baseUrl" />
    <main v-else class="auth-page" :class="{ 'auth-page--pending': view === 'pending', 'auth-page--login': view === 'login' }">
      <section class="auth-panel">
        <header class="auth-panel__header">
          <h1 class="auth-panel__brand">
            <img class="auth-panel__logo" src="/favicon.svg" alt="" aria-hidden="true" width="48" height="48">
            <span>{{ t('app.brandLead') }}<span class="auth-panel__brand-accent">{{ t('app.brandAccent') }}</span></span>
          </h1>
        </header>
        <p v-if="view === 'loading'" role="status">{{ t('auth.loading') }}</p>
        <template v-else-if="view === 'setup'">
          <h2 class="auth-panel__title">{{ t('auth.setupTitle') }}</h2>
          <p class="auth-panel__intro">{{ t('auth.setupHint') }}</p>
          <form class="auth-panel__form" @submit.prevent="submitSetup">
            <NFormItem>
              <template #label>
                <span class="auth-panel__field-label">{{ t('auth.setupCode') }} <UxInfoHint :text="t('auth.setupCodeHelp')" /></span>
              </template>
              <NInput v-model:value="setupCode" :input-props="{ 'aria-label': t('auth.setupCode') }" autocomplete="one-time-code" />
            </NFormItem>
            <NFormItem :label="t('auth.username')"><NInput v-model:value="username" :input-props="{ 'aria-label': t('auth.username') }" autocomplete="username" /></NFormItem>
            <div class="auth-panel__password-field">
              <NFormItem :label="t('auth.password')" :show-feedback="false"><NInput v-model:value="password" :input-props="{ 'aria-label': t('auth.password'), 'aria-describedby': 'auth-password-requirements' }" type="password" show-password-on="click" autocomplete="new-password" /></NFormItem>
              <p id="auth-password-requirements" class="auth-panel__field-hint">{{ t('auth.passwordRequirements') }}</p>
            </div>
            <NButton type="primary" attr-type="submit" :loading="busy">{{ t('auth.createAdmin') }}</NButton>
          </form>
        </template>
        <template v-else-if="view === 'login'">
          <h2 class="auth-panel__title">{{ t('auth.loginTitle') }}</h2>
          <form class="auth-panel__form" @submit.prevent="submitLogin">
            <NFormItem :label="t('auth.username')"><NInput v-model:value="username" :input-props="{ 'aria-label': t('auth.username') }" autocomplete="username" /></NFormItem>
            <NFormItem :label="t('auth.password')"><NInput v-model:value="password" :input-props="{ 'aria-label': t('auth.password') }" type="password" show-password-on="click" autocomplete="current-password" /></NFormItem>
            <NButton type="primary" attr-type="submit" :loading="busy">{{ t('auth.login') }}</NButton>
          </form>
        </template>
        <template v-else-if="view === 'change'">
          <h2 class="auth-panel__title">{{ t('auth.changeTitle') }}</h2>
          <p class="auth-panel__intro">{{ t('auth.changeHint') }}</p>
          <form class="auth-panel__form" @submit.prevent="submitPassword">
            <div class="auth-panel__password-field">
              <NFormItem :label="t('auth.newPassword')" :show-feedback="false"><NInput v-model:value="newPassword" :input-props="{ 'aria-label': t('auth.newPassword'), 'aria-describedby': 'auth-password-requirements' }" type="password" show-password-on="click" autocomplete="new-password" /></NFormItem>
              <p id="auth-password-requirements" class="auth-panel__field-hint">{{ t('auth.passwordRequirements') }}</p>
            </div>
            <NSpace><NButton type="primary" attr-type="submit" :loading="busy">{{ t('auth.changePassword') }}</NButton><NButton :disabled="busy" @click="logout">{{ t('auth.logout') }}</NButton></NSpace>
          </form>
        </template>
        <template v-else-if="view === 'pending'">
          <h2 class="auth-panel__title">{{ t('auth.pendingTitle') }}</h2>
          <p>{{ t('auth.pendingHint') }}</p>
          <div class="auth-actions"><NButton :disabled="busy" @click="logout">{{ t('auth.logout') }}</NButton></div>
        </template>
        <template v-else-if="view === 'missingStockInfo'">
          <h2 class="auth-panel__title">{{ t('startup.noApiUrlTitle') }}</h2>
          <p>{{ t('startup.noApiUrlBody') }}</p>
          <div class="auth-actions"><NButton :disabled="busy" @click="logout">{{ t('auth.logout') }}</NButton></div>
        </template>
        <template v-else>
          <h2 class="auth-panel__title">{{ t('auth.unavailableTitle') }}</h2>
          <p>{{ t('auth.unavailableHint') }}</p>
          <div class="auth-actions"><NButton @click="initialize">{{ t('auth.retry') }}</NButton></div>
        </template>
        <p v-if="errorMessage" role="alert" class="auth-error">{{ errorMessage }}</p>
      </section>
    </main>
  </NConfigProvider>
</template>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-6);
  background: radial-gradient(circle at 50% 0, rgb(var(--brand-from) / 0.12), transparent 55%),
    rgb(var(--surface-page));
}

.auth-page--pending { padding-bottom: calc(var(--space-6) + 8vh); }

// Die Mitte des Login-Panels liegt bei 38,2 % der Fensterhöhe.
.auth-page--login {
  padding-bottom: calc(var(--space-6) + 23.6vh);

  @media (max-height: 650px) { padding-bottom: var(--space-6); }
}

.auth-panel {
  width: min(100%, 30rem);
  padding: clamp(var(--space-6), 5vw, var(--space-8));
  border: 1px solid rgb(var(--border-default));
  border-radius: var(--radius-lg);
  background: rgb(var(--surface-card));
  box-shadow: var(--shadow-lg);

  &__header { margin-bottom: var(--space-8); }
  &__brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 5vw, 1.875rem);
    font-weight: 700;
    letter-spacing: -0.035em;
    line-height: 1.15;
  }
  &__brand-accent { color: rgb(var(--brand-word)); }
  &__logo { flex: none; width: 3rem; height: 3rem; }
  &__title {
    margin: 0 0 var(--space-3);
    font-family: var(--font-display);
    font-size: 1.375rem;
    line-height: 1.3;
  }
  &__intro { margin: 0; color: rgb(var(--text-secondary)); }
  &__form { margin-top: var(--space-6); }
  &__field-label { display: inline-flex; align-items: center; gap: var(--space-2); }
  &__password-field { margin-bottom: var(--space-4); }
  &__field-hint { margin: 0; color: rgb(var(--text-secondary)); font-size: 0.8125rem; }
  p { line-height: 1.5; }
}

.auth-actions { margin-top: var(--space-6); }
.auth-error { color: rgb(var(--status-out)); margin-top: var(--space-4); }
</style>
