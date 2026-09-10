<script setup lang="ts">
/**
 * Meldet einen nicht erreichbaren Dienst — mittig und unübersehbar.
 *
 * Zuerst war das ein Toast, und der war zu leise: Der Ausfall blieb im
 * Ampelpunkt der Statuszeile stecken, und wer eine falsche Adresse
 * konfiguriert hatte, merkte es erst auf der Papiere-Seite — der einzigen
 * Ansicht, die den Fehler ausspricht. Die Kurse fallen still auf den Cache
 * zurück und schweigen.
 *
 * Ein Dialog ist hier vertretbar, obwohl Zustände sonst als Toast erscheinen:
 * Ohne Dienst gibt es keine frischen Kurse, und damit steht jede Kennzahl der
 * App auf altem Bestand. Das ist kein Randzustand, sondern die Bedingung
 * dafür, dass die App überhaupt etwas kann.
 *
 * **Einmal je Sitzung.** Ist der Dienst länger weg, käme er sonst bei jedem
 * Seitenaufruf. Der Merker liegt im `sessionStorage` und nicht im
 * `localStorage`: Beim nächsten Öffnen der App soll die Meldung wieder
 * erscheinen — sie ist eine Begrüßung mit schlechter Nachricht, keine
 * Einstellung.
 */
import { computed, inject, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NButton, NModal, NSpace } from 'naive-ui'

import { useApiStatusStore } from '@/stores/apiStatus'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

const SESSION_KEY = 'stockportfolio.apiOfflineShown'

const { t } = useI18n()
const router = useRouter()
const apiStatus = useApiStatusStore()
const client = inject<StockInfoClient>(STOCK_INFO_CLIENT) ?? null

const show = ref<boolean>(false)

/**
 * Wurde in dieser Sitzung schon gemeldet?
 *
 * Mit `try`, weil schon der Zugriff auf `sessionStorage` wirft, wenn ein
 * Browser ihn sperrt — dasselbe Muster wie `safeStorage` im Fundament. Ein
 * gesperrter Speicher darf höchstens dazu führen, dass die Meldung erneut
 * erscheint, niemals dazu, dass die App nicht startet.
 */
function bereitsGemeldet(): boolean {
  try {
    return globalThis.sessionStorage?.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function merkeGemeldet(): void {
  try {
    globalThis.sessionStorage?.setItem(SESSION_KEY, '1')
  } catch {
    // Ohne Speicher erscheint die Meldung beim nächsten Aufruf noch einmal.
  }
}

watch(
  () => apiStatus.state,
  (state) => {
    if (state !== 'offline' || bereitsGemeldet()) return
    show.value = true
    merkeGemeldet()
  },
  { immediate: true },
)

/**
 * Der Satz zum Fehler, zerlegt an der Adresse.
 *
 * Die Adresse wird dadurch anklickbar: Wer eine falsche sieht, will sie
 * ausprobieren, statt sie abzutippen. Steht sie nicht im Satz — etwa weil der
 * Fehler keine trug —, bleibt alles wie es ist und es gibt keinen Link.
 */
const reason = computed(() => {
  const satz = apiStatus.error ?? ''
  const url = apiStatus.errorUrl
  const stelle = url ? satz.indexOf(url) : -1
  if (!url || stelle < 0) return { vor: satz, url: null, nach: '' }

  // `indexOf` und `slice` statt `split`: Steht die Adresse zweimal im Satz —
  // manche Browser packen sie schon in ihre eigene Fehlermeldung —, verwürfe
  // `split` alles ab dem zweiten Vorkommen, und mit ihm die Herkunftsangabe.
  return { vor: satz.slice(0, stelle), url, nach: satz.slice(stelle + url.length) }
})

async function pruefeErneut(): Promise<void> {
  if (!client) return
  await apiStatus.check(client)
  // Antwortet der Dienst wieder, hat der Dialog seinen Zweck erfüllt.
  if (apiStatus.state === 'online') show.value = false
}

function zurStatusseite(): void {
  show.value = false
  void router.push({ path: '/settings', query: { tab: 'status' } })
}
</script>

<template>
  <!--
    Naives Autofokus bleibt **an**.

    Ein Zwischenstand schaltete ihn ab, um den Ring von der Adresse auf „Erneut
    prüfen" zu holen. Der eigene `focus()`-Aufruf dafür lief aber ins Leere —
    `NButton` hat keins, nur `selfElRef` —, und übrig blieb ein Dialog ganz ohne
    Fokus: keine Ansage für Vorleseprogramme, kein Einstieg für die Tastatur.
    Den Fokus von Hand zu setzen scheitert an der Fokusfalle, die ihn
    zurückholt; `nextTick`, Animationsbild und eine Runde der Ereignisschleife
    sind durchprobiert (siehe `tests/components/appApiAlert.spec.ts`).

    Also der Standard: Der Fokus landet auf dem ersten fokussierbaren Element,
    heute der Adresse. Optisch ist das nicht ideal — funktional ist es richtig,
    und ein Dialog ohne Fokus wäre deutlich schlechter.
  -->
  <NModal
    v-model:show="show"
    preset="dialog"
    type="error"
    :title="t('notify.apiOfflineTitle')"
    :closable="true"
  >
    <div class="apialert">
      <p class="apialert__reason">
        {{ reason.vor
        }}<!--
          Neues Fenster: Ein Klick soll die App nicht verlassen — man will die
          Adresse prüfen und dann hier weitermachen.
        --><a
          v-if="reason.url"
          class="apialert__url"
          :href="reason.url"
          target="_blank"
          rel="noreferrer"
          >{{ reason.url }}</a>{{ reason.nach }}
      </p>
      <p class="apialert__body">{{ t('notify.apiOfflineBody') }}</p>
    </div>

    <template #action>
      <NSpace>
        <NButton secondary @click="zurStatusseite">
          {{ t('notify.apiOfflineSettings') }}
        </NButton>
        <NButton
          type="primary"
          :loading="apiStatus.state === 'checking'" @click="pruefeErneut"
        >
          {{ t('notify.apiOfflineRetry') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.apialert {
  @include stack(var(--space-3));

  &__reason {
    // Die Adresse ist der Kern der Nachricht — sie darf umbrechen, aber nicht
    // in der Zeile verschwinden.
    overflow-wrap: anywhere;
    font-family: var(--font-ui);
    font-size: var(--font-sm);
  }

  // Anklickbar und als solches erkennbar: Akzentfarbe wie jeder Verweis, die
  // Unterstreichung erst beim Überfahren — in einem Fehlertext soll sie nicht
  // um Aufmerksamkeit mit der Nachricht ringen.
  &__url {
    color: token(--accent);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__body {
    @include muted(var(--font-sm));
  }
}
</style>
