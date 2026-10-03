<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NButton, NCheckbox, NConfigProvider, NFormItem, NInput, NPopconfirm, NSpace, darkTheme, type GlobalThemeOverrides } from 'naive-ui'
import { buildNaiveOverrides, THEMES, UxInfoHint } from '@mmit/ux-foundation'
import { STOCK_INFO_CLIENT, StockInfoClient } from '@/api/client'
import { useApiStatusStore } from '@/stores/apiStatus'
import { naiveLocales } from '@/i18n/naiveLocale'
import { readStoredTheme } from '@/stores/theme'
import { activatePrivateData, deactivatePrivateData, PrivateDataClient } from '@/data/client'
import { clearMarketCaches } from '@/db/cache'
import { useLegacyStore } from '@/stores/legacy'
import AuthenticatedApp from './AuthenticatedApp.vue'
import EmphasizedText from '@/components/EmphasizedText.vue'
import { PortfolioAuthClient, PortfolioApiError, type PortfolioUser } from './client'
import { AUTH_CLIENT, AUTH_LOGOUT, AUTH_USER } from './context'

type View = 'loading' | 'setup' | 'login' | 'change' | 'app' | 'legacy' | 'missingStockInfo' | 'unavailable'

const { t, te, locale } = useI18n()
const router = useRouter()
const client = new PortfolioAuthClient()
const user = ref<PortfolioUser | null>(null)
const view = ref<View>('loading')
const showStartupStatus = ref(false)
let startupTimer: ReturnType<typeof setTimeout> | null = null
const busy = ref(false)
const errorCode = ref('')
const setupCode = ref('')
const username = ref('')
const password = ref('')
const newPassword = ref('')
/*
 * Bestätigung des Hinweises zu Anlageentscheidungen. Sie gilt nur für diesen
 * einen Login und wird nicht gespeichert (Mike, 2026-10-01).
 */
const noticeAccepted = ref(false)
/*
 * Der einzige StockInfo-Client der Sitzung. Seine Adresse kennt er selbst
 * (Weiterleitung über den eigenen Server, T-82); niemand reicht sie durch.
 */
const stockInfoClient = new StockInfoClient()
const apiStatus = useApiStatusStore()
const legacyStore = useLegacyStore()
const { legacyData } = storeToRefs(legacyStore)
const isDark = THEMES[readStoredTheme()].isDark
const naiveOverrides = ref<GlobalThemeOverrides>({})

provide(AUTH_CLIENT, client)
provide(STOCK_INFO_CLIENT, stockInfoClient)
provide(AUTH_USER, user)
provide(AUTH_LOGOUT, logout)

const errorMessage = computed(() => {
  if (!errorCode.value) return ''
  const key = `auth.errors.${errorCode.value}`
  return te(key) ? t(key) : t('auth.errors.request_failed')
})

async function acceptUser(nextUser: PortfolioUser): Promise<void> {
  const cameFromLogin = view.value === 'login' || view.value === 'change' || view.value === 'setup'
  user.value = nextUser
  errorCode.value = ''
  legacyStore.clearPreview()
  if (nextUser.mustChangePassword) {
    view.value = 'change'
  } else {
    try {
      if (!(await loadStockInfoTarget())) {
        view.value = 'missingStockInfo'
        return
      }
      activatePrivateData(new PrivateDataClient())
      if (nextUser.isSetupAccount) {
        if (await legacyStore.inspect()) {
          view.value = 'legacy'
          return
        }
      }
      view.value = 'app'
      if (cameFromLogin) void router.replace({ name: 'dashboard' })
    } catch (error) {
      reportError(error)
      view.value = 'unavailable'
    }
  }
}

/**
 * Fragt den Server, welche StockInfo-Adresse er nutzt, und legt sie für die
 * Anzeige im Status-Store ab.
 *
 * @returns `false` nur, wenn der Server sicher keine Adresse kennt. Ist die
 *   Auskunft gerade nicht zu haben, startet die App trotzdem; die Statusseite
 *   meldet den Rest.
 */
async function loadStockInfoTarget(): Promise<boolean> {
  try {
    const target = await stockInfoClient.target()
    apiStatus.setTarget(target)
    return target !== null
  } catch (error) {
    console.warn('StockInfo-Adresse nicht abfragbar', error)
    return true
  }
}

function reportError(error: unknown): void {
  errorCode.value = error instanceof PortfolioApiError ? error.code : 'request_failed'
}

async function initialize(): Promise<void> {
  view.value = 'loading'
  showStartupStatus.value = false
  if (startupTimer !== null) clearTimeout(startupTimer)
  startupTimer = setTimeout(() => { showStartupStatus.value = true }, 350)
  try {
    const setup = await client.setupStatus()
    if (setup.required) {
      view.value = 'setup'
      return
    }
    const session = await client.session()
    if (session) await acceptUser(session)
    else {
      deactivatePrivateData()
      view.value = 'login'
    }
  } catch (error) {
    console.error('StockPortfolio auth initialization failed', error)
    view.value = 'unavailable'
  } finally {
    if (startupTimer !== null) clearTimeout(startupTimer)
    startupTimer = null
  }
}

async function submitSetup(): Promise<void> {
  busy.value = true
  errorCode.value = ''
  try {
    await client.setup(setupCode.value, username.value, password.value)
    await acceptUser((await client.login(username.value, password.value)).user)
    setupCode.value = ''
    password.value = ''
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

async function submitLogin(): Promise<void> {
  // Enter im Formular umgeht den gesperrten Knopf; deshalb auch hier prüfen.
  if (!noticeAccepted.value) return
  busy.value = true
  errorCode.value = ''
  try {
    await acceptUser((await client.login(username.value, password.value)).user)
    password.value = ''
    noticeAccepted.value = false
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
    await acceptUser((await client.changePassword(newPassword.value)).user)
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
    await clearMarketCaches()
    await client.logout()
    deactivatePrivateData()
    legacyStore.clearPreview()
    user.value = null
    view.value = 'login'
    errorCode.value = ''
    void router.replace({ name: 'dashboard' })
    window.location.reload()
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

async function importLegacy(): Promise<void> {
  if (!legacyData.value || !user.value) return
  busy.value = true
  errorCode.value = ''
  try {
    await legacyStore.importToSetupAccount()
    user.value = { ...user.value, legacyImported: true }
    view.value = 'app'
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

async function discardLegacy(): Promise<void> {
  busy.value = true
  errorCode.value = ''
  try {
    await legacyStore.discard()
    view.value = 'app'
  } catch (error) {
    reportError(error)
  } finally {
    busy.value = false
  }
}

function continueWithoutImport(): void {
  view.value = 'app'
}

function exportLegacy(index: number): void {
  const exported = legacyStore.exportAt(index)
  if (!exported) return
  const url = URL.createObjectURL(new Blob([JSON.stringify(exported.backup, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = exported.fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  naiveOverrides.value = buildNaiveOverrides()
  void initialize()
})
onUnmounted(() => { if (startupTimer !== null) clearTimeout(startupTimer) })
</script>

<template>
  <NConfigProvider :locale="locale === 'de' ? naiveLocales.de : naiveLocales.en" :theme="isDark ? darkTheme : null" :theme-overrides="naiveOverrides" inline-theme-disabled>
    <AuthenticatedApp v-if="view === 'app'" />
    <main v-else-if="view !== 'loading' || showStartupStatus" class="auth-page" :class="{ 'auth-page--login': view === 'login' }">
      <section class="auth-panel" :class="{ 'auth-panel--wide': view === 'login' }">
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
          <!--
            Mobil steht der Hinweis unter den Eingabefeldern, ab `md` daneben.
            Haken und Knopf folgen immer darunter über die ganze Breite.
          -->
          <form class="auth-panel__form auth-login" @submit.prevent="submitLogin">
            <div class="auth-login__fields">
              <NFormItem :label="t('auth.username')"><NInput v-model:value="username" :input-props="{ 'aria-label': t('auth.username') }" autocomplete="username" /></NFormItem>
              <NFormItem :label="t('auth.password')"><NInput v-model:value="password" :input-props="{ 'aria-label': t('auth.password') }" type="password" show-password-on="click" autocomplete="current-password" /></NFormItem>
            </div>
            <div id="auth-investment-notice" class="auth-login__notice"><EmphasizedText :text="t('auth.investmentNotice')" /></div>
            <div class="auth-login__confirm">
              <NCheckbox v-model:checked="noticeAccepted" aria-describedby="auth-investment-notice">{{ t('auth.investmentConfirm') }}</NCheckbox>
            </div>
            <div class="auth-login__action">
              <NButton type="primary" attr-type="submit" :loading="busy" :disabled="!noticeAccepted">{{ t('auth.login') }}</NButton>
            </div>
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
        <template v-else-if="view === 'legacy'">
          <h2 class="auth-panel__title">{{ t('legacy.title') }}</h2>
          <p class="auth-panel__intro">
            {{ user?.legacyImported ? t('legacy.alreadyImported') : t('legacy.intro') }}
          </p>
          <dl class="legacy-facts">
            <dt>{{ t('legacy.source') }}</dt>
            <dd>{{ t('legacy.browser') }}</dd>
            <dt>{{ t('legacy.target') }}</dt>
            <dd>{{ user?.username }}</dd>
            <dt>{{ t('legacy.portfolios') }}</dt>
            <dd>{{ legacyData?.portfolios.length }}</dd>
          </dl>
          <ul class="legacy-list">
            <li v-for="(entry, index) in legacyData?.portfolios ?? []" :key="entry.portfolio.id">
              <span>{{ entry.portfolio.name }} · {{ entry.portfolio.positions.length }} {{ t('legacy.positions') }}</span>
              <NButton v-if="user?.legacyImported" size="small" @click="exportLegacy(index)">{{ t('legacy.export') }}</NButton>
            </li>
          </ul>
          <p class="auth-panel__intro">
            {{ user?.legacyImported ? t('legacy.restoreHint') : t('legacy.importHint') }}
          </p>
          <NSpace class="legacy-actions">
            <NButton v-if="!user?.legacyImported" type="primary" :loading="busy" @click="importLegacy">{{ t('legacy.import') }}</NButton>
            <NButton :disabled="busy" @click="continueWithoutImport">{{ t('legacy.later') }}</NButton>
            <NPopconfirm @positive-click="discardLegacy">
              <template #trigger><NButton type="error" ghost :disabled="busy">{{ t('legacy.discard') }}</NButton></template>
              {{ t('legacy.discardConfirm') }}
            </NPopconfirm>
          </NSpace>
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

  // Login mit Hinweis braucht auf breiten Bildschirmen Platz für zwei Spalten.
  &--wide { @include up(md) { width: min(100%, 54rem); } }
  p { line-height: 1.5; }
}

.auth-login {
  display: grid;
  grid-template-areas: "fields" "notice" "confirm" "action";

  @include up(md) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas: "fields notice" "confirm confirm" "action action";
    column-gap: var(--space-8);
    align-items: start;
  }

  &__fields { grid-area: fields; }
  &__notice {
    grid-area: notice;
    margin: 0 0 var(--space-3);
    padding: var(--space-3) var(--space-4);
    // Dezent: Der Strich gliedert, er soll nicht mit dem Text konkurrieren.
    border-left: 2px solid rgb(var(--border-subtle));
    color: rgb(var(--text-secondary));
    font-size: 0.8125rem;

    // Neben den Feldern beginnt der Hinweis auf Höhe der ersten Beschriftung.
    @include up(md) { margin: 0 0 var(--space-6); }
  }
  &__confirm { grid-area: confirm; margin-bottom: var(--space-4); }
  &__action { grid-area: action; }
}

.auth-actions { margin-top: var(--space-6); }
.auth-error { color: rgb(var(--status-out)); margin-top: var(--space-4); }
.legacy-facts { display: grid; grid-template-columns: auto 1fr; gap: var(--space-2) var(--space-4); margin: var(--space-6) 0; }
.legacy-facts dt { color: rgb(var(--text-secondary)); }
.legacy-facts dd { margin: 0; }
.legacy-list { display: grid; gap: var(--space-2); margin: 0 0 var(--space-6); padding-left: var(--space-6); }
.legacy-list li { padding-left: var(--space-1); }
.legacy-actions { margin-top: var(--space-6); }
</style>
