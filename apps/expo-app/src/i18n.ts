export type Lang = "pt-BR" | "en-US" | "es-ES"

export type Strings = {
  navHome: string
  navDiscover: string
  navLists: string
  navProfile: string
  navSearch: string
  following: string
  activity: string
  nowShowing: string
  upcoming: string
  inTheaters: string
  comingSoon: string
  catalogLink: string
  seeAll: string
  searchPlaceholder: string
  signIn: string
  signUp: string
  continueAsGuest: string
  continueLabel: string
  skip: string
  email: string
  password: string
  whereToWatch: string
  overview: string
  watched: string
  watchlist: string
  lists: string
  shining: string
  onboardingTitle: string
  onboardingHint: string
  watchRegion: string
  language: string
  noResults: string
  films: string
  series: string
  people: string
  publicLists: string
  yourLists: string
  logWatch: string
  trailer: string
  friends: string
  feedPublic: string
  diaryTagline: string
  guestMode: string
  signOut: string
}

const ptBR: Strings = {
  navHome: "Início",
  navDiscover: "Descobrir",
  navLists: "Listas",
  navProfile: "Perfil",
  navSearch: "Buscar",
  following: "Seguindo",
  activity: "Atividade",
  nowShowing: "Em cartaz",
  upcoming: "Em breve",
  inTheaters: "Nos cinemas",
  comingSoon: "Em breve",
  catalogLink: "Catálogo →",
  seeAll: "Ver todos →",
  searchPlaceholder: "Filmes, séries, pessoas…",
  signIn: "Entrar",
  signUp: "Criar conta",
  continueAsGuest: "Continuar como convidado",
  continueLabel: "Continuar",
  skip: "Pular",
  email: "E-mail",
  password: "Senha",
  whereToWatch: "Onde assistir",
  overview: "Sinopse",
  watched: "Assistidos",
  watchlist: "Quero ver",
  lists: "Listas",
  shining: "The Shining",
  onboardingTitle: "Como podemos te chamar?",
  onboardingHint: "Nome, região e idioma — você muda depois.",
  watchRegion: "Região de streaming",
  language: "Idioma",
  noResults: "Nenhum resultado",
  films: "Filmes",
  series: "Séries",
  people: "Pessoas",
  publicLists: "Públicas",
  yourLists: "Suas",
  logWatch: "Registrar",
  trailer: "Trailer",
  friends: "Amigos",
  feedPublic: "Público",
  diaryTagline: "Diário de cinema",
  guestMode: "Modo convidado",
  signOut: "Sair (mock)",
}

const en: Strings = {
  ...ptBR,
  navHome: "Home",
  navDiscover: "Discover",
  navLists: "Lists",
  navProfile: "Profile",
  navSearch: "Search",
  following: "Following",
  activity: "Activity",
  nowShowing: "Now showing",
  upcoming: "Upcoming",
  inTheaters: "In theaters",
  comingSoon: "Coming soon",
  catalogLink: "Catalog →",
  seeAll: "See all →",
  searchPlaceholder: "Films, series, people…",
  signIn: "Sign in",
  signUp: "Sign up",
  continueAsGuest: "Continue as guest",
  continueLabel: "Continue",
  skip: "Skip",
  email: "Email",
  password: "Password",
  whereToWatch: "Where to watch",
  overview: "Overview",
  watched: "Watched",
  watchlist: "Watchlist",
  shining: "The Shining",
  onboardingTitle: "What should we call you?",
  onboardingHint: "Name, region, and language — change anytime.",
  watchRegion: "Watch region",
  language: "Language",
  noResults: "No results",
  films: "Films",
  series: "Series",
  people: "People",
  publicLists: "Public",
  yourLists: "Yours",
  logWatch: "Log",
  friends: "Friends",
  feedPublic: "Public",
  diaryTagline: "Your film diary",
  guestMode: "Guest mode",
  signOut: "Sign out (mock)",
}

const es: Strings = {
  ...ptBR,
  navHome: "Inicio",
  navDiscover: "Descubrir",
  navLists: "Listas",
  navProfile: "Perfil",
  navSearch: "Buscar",
  following: "Siguiendo",
  activity: "Actividad",
  nowShowing: "En cartelera",
  upcoming: "Próximamente",
  inTheaters: "En cines",
  comingSoon: "Próximamente",
  catalogLink: "Catálogo →",
  seeAll: "Ver todos →",
  searchPlaceholder: "Películas, series, personas…",
  signIn: "Entrar",
  signUp: "Crear cuenta",
  continueAsGuest: "Continuar como invitado",
  continueLabel: "Continuar",
  skip: "Omitir",
  email: "Correo",
  password: "Contraseña",
  whereToWatch: "Dónde ver",
  overview: "Sinopsis",
  watched: "Vistos",
  watchlist: "Pendientes",
  onboardingTitle: "¿Cómo te llamamos?",
  onboardingHint: "Nombre, región e idioma — puedes cambiarlos después.",
  watchRegion: "Región de streaming",
  language: "Idioma",
  noResults: "Sin resultados",
  films: "Películas",
  series: "Series",
  people: "Personas",
  publicLists: "Públicas",
  yourLists: "Tuyas",
  logWatch: "Registrar",
  friends: "Amigos",
  feedPublic: "Público",
  diaryTagline: "Diario de cine",
  guestMode: "Modo invitado",
  signOut: "Salir (mock)",
}

export function t(lang: Lang): Strings {
  if (lang === "en-US") return en
  if (lang === "es-ES") return es
  return ptBR
}
