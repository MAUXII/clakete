import {
  DEFAULT_UI_LOCALE,
  formatMessage,
  getMessage,
  resolveUiLocale,
  type MessageTree,
  type UiLocale,
} from "@/lib/i18n/locales"
import { ptBR, type AppMessages } from "@/lib/i18n/messages/pt-BR"
import { enUS } from "@/lib/i18n/messages/en-US"
import { esES } from "@/lib/i18n/messages/es-ES"
import { ptPT } from "@/lib/i18n/messages/pt-PT"

const BUNDLES: Record<UiLocale, AppMessages> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "es-ES": esES,
  "pt-PT": ptPT,
}

export type { UiLocale, AppMessages }
export { resolveUiLocale, DEFAULT_UI_LOCALE }

export function getMessages(locale: UiLocale | string | null | undefined): AppMessages {
  return BUNDLES[resolveUiLocale(locale)] ?? BUNDLES[DEFAULT_UI_LOCALE]
}

/** Translate a dotted key, e.g. `nav.home`. Falls back to en-US then the key. */
export function translate(
  locale: UiLocale | string | null | undefined,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const primary = getMessages(locale) as unknown as MessageTree
  const fallback = BUNDLES["en-US"] as unknown as MessageTree
  const raw =
    getMessage(primary, key) ?? getMessage(fallback, key) ?? key
  return formatMessage(raw, vars)
}

/** @deprecated Use translate / useT — kept for older catalog call sites. */
export function catalogT(
  language: string | null | undefined,
  key: string,
  vars?: Record<string, string>,
): string {
  return translate(language, `catalog.${key}`, vars)
}
