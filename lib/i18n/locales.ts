export const UI_LOCALES = ["pt-BR", "en-US", "es-ES", "pt-PT"] as const
export type UiLocale = (typeof UI_LOCALES)[number]

export const DEFAULT_UI_LOCALE: UiLocale = "pt-BR"

export function resolveUiLocale(language: string | null | undefined): UiLocale {
  if (
    language === "pt-BR" ||
    language === "en-US" ||
    language === "es-ES" ||
    language === "pt-PT"
  ) {
    return language
  }
  if (language?.startsWith("pt")) return "pt-BR"
  if (language?.startsWith("es")) return "es-ES"
  if (language?.startsWith("en")) return "en-US"
  return DEFAULT_UI_LOCALE
}

export type MessageTree = { [key: string]: string | MessageTree }

export function getMessage(
  tree: MessageTree,
  path: string,
): string | undefined {
  const parts = path.split(".")
  let cur: string | MessageTree | undefined = tree
  for (const part of parts) {
    if (cur == null || typeof cur === "string") return undefined
    cur = cur[part]
  }
  return typeof cur === "string" ? cur : undefined
}

export function formatMessage(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v))
  }
  return out
}
