<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/**
 * Die Methode — einmal zusammenhängend erklärt.
 *
 * Bewusst nicht in der Hauptnavigation: Wer die App öffnet, will sie
 * ausprobieren, nicht lesen. Erreichbar ist die Seite über die Fragezeichen
 * an den Begriffen, also genau dann, wenn jemand tatsächlich eine Frage hat.
 *
 * Reiner Text, keine Daten — deshalb auch keine Stores.
 */
const { t } = useI18n()
</script>

<template>
  <!--
    Schmale Spalte: Fließtext über 1400 Pixel Breite liest sich niemand
    freiwillig. Die Sprungmarken entsprechen den `anchor`-Angaben der
    Fragezeichen.
  -->
  <article class="max-w-[46rem] mx-auto px-6 py-8 flex flex-col gap-8">
    <header class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold">{{ t('method.title') }}</h1>
      <p class="text-sm text-ink-secondary leading-relaxed">{{ t('method.intro') }}</p>
    </header>

    <section id="bands" class="flex flex-col gap-3 scroll-mt-20">
      <h2 class="text-lg font-medium">{{ t('method.bandsHeading') }}</h2>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.bandsBody') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.bandsBody2') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.bandsDelta') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.bandsDelta2') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.bandsBody3') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.bandsBody4') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.bandsMinTrade') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.bandsMinTrade2') }}</p>
    </section>

    <section id="trigger" class="flex flex-col gap-3 scroll-mt-20">
      <h2 class="text-lg font-medium">{{ t('method.triggerHeading') }}</h2>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.triggerBody') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.triggerBody2') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.triggerBody3') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.triggerBody4') }}</p>
    </section>

    <section id="classes" class="flex flex-col gap-3 scroll-mt-20">
      <h2 class="text-lg font-medium">{{ t('method.classesHeading') }}</h2>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.classesBody') }}</p>
    </section>

    <section id="reserve" class="flex flex-col gap-3 scroll-mt-20">
      <h2 class="text-lg font-medium">{{ t('method.reserveHeading') }}</h2>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.reserveBody') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.reserveBody2') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.reserveBody3') }}</p>
    </section>

    <section id="plan" class="flex flex-col gap-3 scroll-mt-20">
      <h2 class="text-lg font-medium">{{ t('method.planHeading') }}</h2>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.planBody') }}</p>
      <p class="text-sm leading-relaxed text-ink-secondary">{{ t('method.planBody2') }}</p>
    </section>

    <!--
      Die Grenzen gehören auf dieselbe Seite wie die Methode. Wer wissen will,
      was die App tut, muss auch erfahren, was sie ausdrücklich nicht tut —
      sonst erwartet er es irgendwann.
    -->
    <section id="limits" class="flex flex-col gap-3 scroll-mt-20">
      <h2 class="text-lg font-medium">{{ t('method.limitsHeading') }}</h2>
      <ul class="flex flex-col gap-2 text-sm leading-relaxed text-ink-secondary">
        <li class="border-l-2 border-edge pl-3">{{ t('method.limitsCurrency') }}</li>
        <li class="border-l-2 border-edge pl-3">{{ t('method.limitsRisk') }}</li>
        <li class="border-l-2 border-edge pl-3">{{ t('method.limitsAdvice') }}</li>
        <li class="border-l-2 border-edge pl-3">{{ t('method.limitsData') }}</li>
      </ul>
    </section>
  </article>
</template>
