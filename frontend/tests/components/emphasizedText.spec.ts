import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EmphasizedText from '@/components/EmphasizedText.vue'

describe('Hervorgehobener Katalogtext', () => {
  it('macht aus Leerzeilen Absätze und aus **…** Fettdruck, ohne HTML auszuführen', () => {
    const wrapper = mount(EmphasizedText, { props: { text: 'Erster **wichtig** Satz.\n\nZweiter <b>kein HTML</b>.' } })
    const paragraphs = wrapper.findAll('p')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]!.get('strong').text()).toBe('wichtig')
    expect(paragraphs[0]!.text()).toBe('Erster wichtig Satz.')
    expect(paragraphs[1]!.find('b').exists()).toBe(false)
    expect(paragraphs[1]!.text()).toBe('Zweiter <b>kein HTML</b>.')
  })
})
