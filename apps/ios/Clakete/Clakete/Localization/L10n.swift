import Foundation

/// Strings locais espelhando `lib/i18n` (front mock — subset).
struct L10n {
  var navHome: String
  var navDiscover: String
  var navLists: String
  var navProfile: String
  var navSearch: String
  var following: String
  var activity: String
  var nowShowing: String
  var upcoming: String
  var inTheaters: String
  var comingSoon: String
  var catalogLink: String
  var seeAll: String
  var searchPlaceholder: String
  var signIn: String
  var signUp: String
  var continueAsGuest: String
  var continueLabel: String
  var skip: String
  var email: String
  var password: String
  var whereToWatch: String
  var overview: String
  var credits: String
  var similar: String
  var watched: String
  var watchlist: String
  var lists: String
  var shining: String
  var onboardingTitle: String
  var onboardingHint: String
  var watchRegion: String
  var language: String
  var noResults: String
  var films: String
  var series: String
  var people: String
  var publicLists: String
  var yourLists: String
  var logWatch: String
  var trailer: String
  var friends: String
  var feedPublic: String

  static var current: L10n {
    switch SessionStore.shared.language {
    case "en-US": return .en
    case "es-ES": return .es
    default: return .ptBR
    }
  }

  static let ptBR = L10n(
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
    credits: "Ficha técnica",
    similar: "Parecidos",
    watched: "Assistidos",
    watchlist: "Quero ver",
    lists: "Listas",
    shining: "The Shining",
    onboardingTitle: "Como podemos te chamar?",
    onboardingHint: "Nome, região e idioma — você muda depois nas preferências.",
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
    feedPublic: "Público"
  )

  static let en = L10n(
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
    credits: "Credits",
    similar: "Similar",
    watched: "Watched",
    watchlist: "Watchlist",
    lists: "Lists",
    shining: "The Shining",
    onboardingTitle: "What should we call you?",
    onboardingHint: "Name, region, and language — change anytime in preferences.",
    watchRegion: "Watch region",
    language: "Language",
    noResults: "No results",
    films: "Films",
    series: "Series",
    people: "People",
    publicLists: "Public",
    yourLists: "Yours",
    logWatch: "Log",
    trailer: "Trailer",
    friends: "Friends",
    feedPublic: "Public"
  )

  static let es = L10n(
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
    credits: "Ficha",
    similar: "Similares",
    watched: "Vistos",
    watchlist: "Pendientes",
    lists: "Listas",
    shining: "The Shining",
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
    trailer: "Tráiler",
    friends: "Amigos",
    feedPublic: "Público"
  )
}
