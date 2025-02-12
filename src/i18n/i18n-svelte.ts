// This file was auto-generated by 'typesafe-i18n'. Any manual changes will be overwritten.
/* eslint-disable */

import { getI18nSvelteStore } from 'typesafe-i18n/adapters/adapter-svelte';
import type { Locales, Translation, TranslationFunctions, Formatters } from './i18n-types'
import { getTranslationForLocale } from './i18n-util'
import { initFormatters } from './formatters'

const { initI18n: init, setLocale, isLoadingLocale, locale, LL } = getI18nSvelteStore<Locales, Translation, TranslationFunctions, Formatters>()

const initI18n = (locale: Locales = 'ja') => init(locale, getTranslationForLocale, initFormatters)

export { initI18n, setLocale, isLoadingLocale, locale, LL }

export default LL
