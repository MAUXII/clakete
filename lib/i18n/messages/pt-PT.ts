import type { AppMessages } from "@/lib/i18n/messages/pt-BR"
import { ptBR } from "@/lib/i18n/messages/pt-BR"

/** European Portuguese — mostly aligned with pt-BR wording */
export const ptPT = {
  ...ptBR,
  common: {
    ...ptBR.common,
    delete: "Eliminar",
    settings: "Definições",
  },
  nav: {
    ...ptBR.nav,
    topRated: "Melhores avaliações",
    upcoming: "Em breve",
  },
  catalog: {
    ...ptBR.catalog,
    whereToWatch: "Onde ver",
  },
  prefs: {
    ...ptBR.prefs,
    homeSections: "Secções da página inicial",
    homeSectionsHint: "Escolha o que aparece na página inicial quando está ligado.",
    unlockShiningBefore: "Desbloqueie Overlook, Noir e Rose com ",
  },
  film: {
    ...ptBR.film,
    credits: "Ficha técnica",
    watchedOn: "Assistido em {date}",
  },
} as const satisfies AppMessages
