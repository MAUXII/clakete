export type MediaItem = {
  id: number
  title: string
  year: string
  posterURL: string
  backdropURL: string
  overview: string
  mediaType: "movie" | "tv"
  rating: number
  genres: string[]
  director?: string
}

export type FeedPost = {
  id: string
  username: string
  avatarInitials: string
  caption: string
  visibility: "friends" | "public"
  media: MediaItem
  likes: number
  comments: number
  timeAgo: string
  isShining: boolean
}

export type UserList = {
  id: string
  title: string
  subtitle: string
  itemCount: number
  isPrivate: boolean
  coverURL: string
}

export type PersonHit = {
  id: number
  name: string
  knownFor: string
}

const poster = (path: string) => `https://image.tmdb.org/t/p/w342${path}`
const backdrop = (path: string) => `https://image.tmdb.org/t/p/w780${path}`

export const MOCK_MOVIES: MediaItem[] = [
  {
    id: 550,
    title: "Clube da Luta",
    year: "1999",
    posterURL: poster("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"),
    backdropURL: backdrop("/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg"),
    overview:
      "Um homem deprimido que sofre de insônia conhece um vendedor de sabão enigmático e formam um clube de luta clandestino.",
    mediaType: "movie",
    rating: 8.4,
    genres: ["Drama", "Thriller"],
    director: "David Fincher",
  },
  {
    id: 155,
    title: "Batman: O Cavaleiro das Trevas",
    year: "2008",
    posterURL: poster("/qJ2tW6WMUDux911r6m7haRef0WH.jpg"),
    backdropURL: backdrop("/hkBaDkMWbLaf8B1lsWsKX7ABN35.jpg"),
    overview: "Batman enfrenta o Coringa, um criminoso que mergulha Gotham no caos.",
    mediaType: "movie",
    rating: 8.5,
    genres: ["Ação", "Crime", "Drama"],
    director: "Christopher Nolan",
  },
  {
    id: 680,
    title: "Pulp Fiction",
    year: "1994",
    posterURL: poster("/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg"),
    backdropURL: backdrop("/suaEOtk1N1sgg2QM528GlmpWeg.jpg"),
    overview: "Histórias entrelaçadas de crime em Los Angeles.",
    mediaType: "movie",
    rating: 8.5,
    genres: ["Crime", "Drama"],
    director: "Quentin Tarantino",
  },
  {
    id: 27205,
    title: "A Origem",
    year: "2010",
    posterURL: poster("/oYuVliqnCIOrIj2VXJ8Q2ZqgJp8.jpg"),
    backdropURL: backdrop("/s3TBrRGB1iav7gFOCNx3H31MoES.jpg"),
    overview: "Um ladrão que invade sonhos recebe a missão impossível de implantar uma ideia.",
    mediaType: "movie",
    rating: 8.4,
    genres: ["Ação", "Ficção científica"],
    director: "Christopher Nolan",
  },
  {
    id: 13,
    title: "Forrest Gump",
    year: "1994",
    posterURL: poster("/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg"),
    backdropURL: backdrop("/7c9UVHBXkTgi8XHf653kpc6xzg3.jpg"),
    overview: "A vida extraordinária de Forrest Gump através das décadas.",
    mediaType: "movie",
    rating: 8.5,
    genres: ["Drama", "Romance"],
    director: "Robert Zemeckis",
  },
  {
    id: 424,
    title: "A Lista de Schindler",
    year: "1993",
    posterURL: poster("/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg"),
    backdropURL: backdrop("/rO4mwmnCaLwuOWMbqhYJZpZLFiC.jpg"),
    overview: "A história de Oskar Schindler durante o Holocausto.",
    mediaType: "movie",
    rating: 8.6,
    genres: ["Drama", "História"],
    director: "Steven Spielberg",
  },
]

export const MOCK_SERIES: MediaItem[] = [
  {
    id: 1396,
    title: "Breaking Bad",
    year: "2008",
    posterURL: poster("/ggFHVNu6YYI5L9pCfOacjizRGt.jpg"),
    backdropURL: backdrop("/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg"),
    overview: "Um professor de química vira fabricante de metanfetamina.",
    mediaType: "tv",
    rating: 8.9,
    genres: ["Drama", "Crime"],
  },
  {
    id: 1399,
    title: "Game of Thrones",
    year: "2011",
    posterURL: poster("/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg"),
    backdropURL: backdrop("/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg"),
    overview: "Nove famílias nobres lutam pelo Trono de Ferro.",
    mediaType: "tv",
    rating: 8.4,
    genres: ["Drama", "Fantasia"],
  },
  {
    id: 87108,
    title: "Chernobyl",
    year: "2019",
    posterURL: poster("/hlLXt2tOPT6VRuTTQ0Kfo594kwX.jpg"),
    backdropURL: backdrop("/aQeZWhw84XgPzHXNLvhEdWpvd6.jpg"),
    overview: "A verdade sobre o desastre nuclear de 1986.",
    mediaType: "tv",
    rating: 8.7,
    genres: ["Drama", "História"],
  },
]

export const MOCK_FEED: FeedPost[] = [
  {
    id: "1",
    username: "marina",
    avatarInitials: "MA",
    caption: "Finalmente assisti. Fincher no auge.",
    visibility: "friends",
    media: MOCK_MOVIES[0],
    likes: 24,
    comments: 5,
    timeAgo: "2h",
    isShining: true,
  },
  {
    id: "2",
    username: "leo.films",
    avatarInitials: "LE",
    caption: "Heath Ledger nunca superado.",
    visibility: "public",
    media: MOCK_MOVIES[1],
    likes: 112,
    comments: 18,
    timeAgo: "5h",
    isShining: false,
  },
  {
    id: "3",
    username: "sofia",
    avatarInitials: "SO",
    caption: "Rewatch merecido.",
    visibility: "friends",
    media: MOCK_MOVIES[2],
    likes: 41,
    comments: 3,
    timeAgo: "1d",
    isShining: false,
  },
]

export const MOCK_LISTS: UserList[] = [
  {
    id: "l1",
    title: "Noir pra chover",
    subtitle: "Crime, sombra e jazz",
    itemCount: 12,
    isPrivate: false,
    coverURL: MOCK_MOVIES[2].backdropURL,
  },
  {
    id: "l2",
    title: "Rewatch 2026",
    subtitle: "Privada",
    itemCount: 7,
    isPrivate: true,
    coverURL: MOCK_MOVIES[0].backdropURL,
  },
  {
    id: "l3",
    title: "Séries curtas",
    subtitle: "Minisséries essenciais",
    itemCount: 5,
    isPrivate: false,
    coverURL: MOCK_SERIES[2].backdropURL,
  },
]

export const MOCK_PEOPLE: PersonHit[] = [
  { id: 525, name: "Christopher Nolan", knownFor: "Diretor" },
  { id: 287, name: "Brad Pitt", knownFor: "Ator" },
  { id: 6193, name: "Leonardo DiCaprio", knownFor: "Ator" },
]

export function findMedia(id: number) {
  return MOCK_MOVIES.find((m) => m.id === id) ?? MOCK_SERIES.find((m) => m.id === id)
}

export function searchAll(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return { movies: [] as MediaItem[], series: [] as MediaItem[], people: [] as PersonHit[] }
  return {
    movies: MOCK_MOVIES.filter((m) => m.title.toLowerCase().includes(q)),
    series: MOCK_SERIES.filter((m) => m.title.toLowerCase().includes(q)),
    people: MOCK_PEOPLE.filter((p) => p.name.toLowerCase().includes(q)),
  }
}
