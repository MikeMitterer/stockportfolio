/**
 * Vitest-Setup.
 *
 * Zwei Dinge global statt in jeder Datei: eine In-Memory-IndexedDB und die
 * i18n-Instanz. Ohne Letztere wirft jede Komponente, die `useI18n` benutzt,
 * beim Mounten — und das trifft inzwischen fast alle.
 */
import 'fake-indexeddb/auto'
import { config } from '@vue/test-utils'
import { i18n } from '@/i18n'

config.global.plugins = [i18n]
