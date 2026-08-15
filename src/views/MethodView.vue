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
  <article class="method">
    <header class="method__header">
      <h1 class="method__title">{{ t('method.title') }}</h1>
      <p class="method__intro">{{ t('method.intro') }}</p>
    </header>

    <section id="bands" class="method__section">
      <h2 class="method__heading">{{ t('method.bandsHeading') }}</h2>
      <p>{{ t('method.bandsBody') }}</p>
      <p>{{ t('method.bandsBody2') }}</p>
      <p>{{ t('method.bandsDelta') }}</p>
      <p>{{ t('method.bandsDelta2') }}</p>
      <p>{{ t('method.bandsBody3') }}</p>
      <p>{{ t('method.bandsBody4') }}</p>
      <p>{{ t('method.bandsMinTrade') }}</p>
      <p>{{ t('method.bandsMinTrade2') }}</p>
    </section>

    <section id="trigger" class="method__section">
      <h2 class="method__heading">{{ t('method.triggerHeading') }}</h2>
      <p>{{ t('method.triggerBody') }}</p>
      <p>{{ t('method.triggerBody2') }}</p>
      <p>{{ t('method.triggerBody3') }}</p>
      <p>{{ t('method.triggerBody4') }}</p>
    </section>

    <section id="classes" class="method__section">
      <h2 class="method__heading">{{ t('method.classesHeading') }}</h2>
      <p>{{ t('method.classesBody') }}</p>
    </section>

    <section id="reserve" class="method__section">
      <h2 class="method__heading">{{ t('method.reserveHeading') }}</h2>
      <p>{{ t('method.reserveBody') }}</p>
      <p>{{ t('method.reserveBody2') }}</p>
      <p>{{ t('method.reserveBody3') }}</p>
    </section>

    <section id="plan" class="method__section">
      <h2 class="method__heading">{{ t('method.planHeading') }}</h2>
      <p>{{ t('method.planBody') }}</p>
      <p>{{ t('method.planBody2') }}</p>
    </section>

    <!--
      Die Grenzen gehören auf dieselbe Seite wie die Methode. Wer wissen will,
      was die App tut, muss auch erfahren, was sie ausdrücklich nicht tut —
      sonst erwartet er es irgendwann.
    -->
    <section id="limits" class="method__section">
      <h2 class="method__heading">{{ t('method.limitsHeading') }}</h2>
      <ul class="method__limits">
        <li>{{ t('method.limitsCurrency') }}</li>
        <li>{{ t('method.limitsRisk') }}</li>
        <li>{{ t('method.limitsAdvice') }}</li>
        <li>{{ t('method.limitsData') }}</li>
      </ul>
    </section>
  </article>
</template>

<style scoped lang="scss">
/*
 * Schmale Spalte: Fließtext über 1400 Pixel Breite liest sich niemand
 * freiwillig.
 */
.method {
  @include stack(var(--space-8));
  max-width: 46rem;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
  font-size: var(--font-sm);
  line-height: 1.625;
  color: token(--text-secondary);

  &__header {
    @include stack(var(--space-2));
  }

  &__title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 600;
    color: token(--text-primary);
  }

  /* Die Sprungmarken entsprechen den `anchor`-Angaben der Fragezeichen. */
  &__section {
    @include stack(var(--space-3));
    scroll-margin-top: 5rem;
  }

  &__heading {
    font-family: var(--font-display);
    font-size: var(--font-lg);
    font-weight: 500;
    color: token(--text-primary);
  }

  &__limits {
    @include stack(var(--space-2));

    li {
      padding-left: var(--space-3);
      border-left: 2px solid token(--border-default);
    }
  }
}
</style>
