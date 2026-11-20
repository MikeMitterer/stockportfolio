<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AssetTypeHint from '@/components/AssetTypeHint.vue'
import LinkIcons from '@/components/LinkIcons.vue'
import { useQuoteIssue } from '@/composables/useQuoteIssue'
import {
  positionIsin,
  positionPrimaryLabel,
  positionSymbol,
  positionType,
} from '@/domain/positionIdentity'
import type { PositionResult } from '@/domain/rebalancing'
import type { ExternalLink } from '@/types/portfolio'

/**
 * Zelle „Position“ der Positionstabelle: Kürzel, ISIN, Hinweise auf Währung
 * und Aktivität, Verweise, Name und Kursproblem (aus `PositionsTable.vue`
 * herausgelöst, T-131). Die Stile stehen global in `_table-cells.scss`, weil
 * Naive UI die Zelle außerhalb des Scopes der Tabelle rendert.
 */
defineProps<{
  row: PositionResult
  links: ExternalLink[]
  /** Ist die Detailansicht dieser Zeile offen? */
  expanded: boolean
}>()

/**
 * Klappt die Zeile auf oder zu. Hängt am Symbol und am Namen, nicht nur am
 * Pfeil links: Wer Näheres zu einem Papier sucht, klickt es an — nicht ein
 * Bedienelement daneben.
 */
const emit = defineEmits<{ toggle: [] }>()

const { t } = useI18n()
const quoteIssue = useQuoteIssue()
</script>

<template>
  <div class="cell-stack">
    <!--
      Kürzel und Verweis-Symbole in einer Zeile — die Links gehören zum
      Papier, nicht in eine eigene Spalte, die die Tabelle breiter macht.
    -->
    <div class="cell-row">
      <button
        class="cell-symbol cell-openable"
        type="button"
        :title="t('table.openDetails')"
        :aria-expanded="expanded"
        @click.stop="emit('toggle')"
      >
        {{ positionPrimaryLabel(row) }}
      </button>
      <span v-if="positionSymbol(row) && positionIsin(row)" class="cell-isin"
        ><span aria-hidden="true">|</span>{{ positionIsin(row) }}</span
      >
      <!--
        Fremde Währung sieht aus wie „inaktiv", ist aber keine Entscheidung
        des Nutzers — deshalb eigene Farbe und eigener Text.
      -->
      <span
        v-if="row.excludedReason === 'currency'"
        class="cell-tag cell-tag--warning"
        :title="t('currency.badgeTitle', { currency: row.quote?.currency ?? '?' })"
        >{{ row.quote?.currency ?? t('currency.warningTitle') }}</span
      >
      <span v-if="row.excludedReason === 'disabled'" class="cell-tag">{{
        t('currency.inactive')
      }}</span>
      <LinkIcons
        v-if="row.position.group !== 'cash'"
        :position="row.position"
        :links="links"
        :quote-type="row.quote?.type"
      />
    </div>
    <div v-if="row.position.group !== 'cash'" class="cell-name-row">
      <button
        class="cell-name cell-openable"
        type="button"
        :title="t('table.openDetails')"
        @click.stop="emit('toggle')"
      >
        {{ row.position.displayName }}
      </button>
      <AssetTypeHint :type="positionType(row)" :label="t('links.appliesToKind')" />
    </div>
    <span v-if="quoteIssue(row)" class="cell-num--missing">{{ quoteIssue(row) }}</span>
  </div>
</template>
