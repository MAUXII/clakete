import Foundation

struct MediaItem: Identifiable, Hashable {
  let id: Int
  let title: String
  let year: String
  let posterURL: URL?
  let backdropURL: URL?
  let overview: String
  let mediaType: MediaType
  let rating: Double
  let genres: [String]
  let director: String?

  enum MediaType: String {
    case movie, tv
  }
}

struct FeedPost: Identifiable {
  let id: String
  let username: String
  let avatarInitials: String
  let caption: String
  let visibility: Visibility
  let media: MediaItem
  let likes: Int
  let comments: Int
  let timeAgo: String
  let isShining: Bool

  enum Visibility {
    case friends, feedPublic
  }
}

struct UserList: Identifiable {
  let id: String
  let title: String
  let subtitle: String
  let itemCount: Int
  let isPrivate: Bool
  let coverURL: URL?
}

struct PersonHit: Identifiable {
  let id: Int
  let name: String
  let knownFor: String
}

enum MockData {
  private static func tmdbPoster(_ path: String) -> URL? {
    URL(string: "https://image.tmdb.org/t/p/w342\(path)")
  }

  private static func tmdbBackdrop(_ path: String) -> URL? {
    URL(string: "https://image.tmdb.org/t/p/w780\(path)")
  }

  static let movies: [MediaItem] = [
    MediaItem(
      id: 550,
      title: "Clube da Luta",
      year: "1999",
      posterURL: tmdbPoster("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"),
      backdropURL: tmdbBackdrop("/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg"),
      overview: "Um homem deprimido que sofre de insônia conhece um vendedor de sabão enigmático e formam um clube de luta clandestino.",
      mediaType: .movie,
      rating: 8.4,
      genres: ["Drama", "Thriller"],
      director: "David Fincher"
    ),
    MediaItem(
      id: 155,
      title: "Batman: O Cavaleiro das Trevas",
      year: "2008",
      posterURL: tmdbPoster("/qJ2tW6WMUDux911r6m7haRef0WH.jpg"),
      backdropURL: tmdbBackdrop("/hkBaDkMWbLaf8B1lsWsKX7ABN35.jpg"),
      overview: "Batman enfrenta o Coringa, um criminoso que mergulha Gotham no caos.",
      mediaType: .movie,
      rating: 8.5,
      genres: ["Ação", "Crime", "Drama"],
      director: "Christopher Nolan"
    ),
    MediaItem(
      id: 680,
      title: "Pulp Fiction",
      year: "1994",
      posterURL: tmdbPoster("/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg"),
      backdropURL: tmdbBackdrop("/suaEOtk1N1sgg2QM528GlmpWeg.jpg"),
      overview: "Histórias entrelaçadas de crime em Los Angeles.",
      mediaType: .movie,
      rating: 8.5,
      genres: ["Crime", "Drama"],
      director: "Quentin Tarantino"
    ),
    MediaItem(
      id: 13,
      title: "Forrest Gump",
      year: "1994",
      posterURL: tmdbPoster("/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg"),
      backdropURL: tmdbBackdrop("/7c9UVHBXkTgi8XHf653kpc6xzg3.jpg"),
      overview: "A vida extraordinária de Forrest Gump através das décadas.",
      mediaType: .movie,
      rating: 8.5,
      genres: ["Drama", "Romance"],
      director: "Robert Zemeckis"
    ),
    MediaItem(
      id: 424,
      title: "A Lista de Schindler",
      year: "1993",
      posterURL: tmdbPoster("/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg"),
      backdropURL: tmdbBackdrop("/rO4mwmnCaLwuOWMbqhYJZpZLFiC.jpg"),
      overview: "A história de Oskar Schindler durante o Holocausto.",
      mediaType: .movie,
      rating: 8.6,
      genres: ["Drama", "História"],
      director: "Steven Spielberg"
    ),
    MediaItem(
      id: 27205,
      title: "A Origem",
      year: "2010",
      posterURL: tmdbPoster("/oYuVliqnCIOrIj2VXJ8Q2ZqgJp8.jpg"),
      backdropURL: tmdbBackdrop("/s3TBrRGB1iav7gFOCNx3H31MoES.jpg"),
      overview: "Um ladrão que invade sonhos recebe a missão impossível de implantar uma ideia.",
      mediaType: .movie,
      rating: 8.4,
      genres: ["Ação", "Ficção científica"],
      director: "Christopher Nolan"
    ),
  ]

  static let series: [MediaItem] = [
    MediaItem(
      id: 1396,
      title: "Breaking Bad",
      year: "2008",
      posterURL: tmdbPoster("/ggFHVNu6YYI5L9pCfOacjizRGt.jpg"),
      backdropURL: tmdbBackdrop("/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg"),
      overview: "Um professor de química vira fabricante de metanfetamina.",
      mediaType: .tv,
      rating: 8.9,
      genres: ["Drama", "Crime"],
      director: "Vince Gilligan"
    ),
    MediaItem(
      id: 1399,
      title: "Game of Thrones",
      year: "2011",
      posterURL: tmdbPoster("/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg"),
      backdropURL: tmdbBackdrop("/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg"),
      overview: "Nove famílias nobres lutam pelo Trono de Ferro.",
      mediaType: .tv,
      rating: 8.4,
      genres: ["Drama", "Fantasia"],
      director: nil
    ),
    MediaItem(
      id: 87108,
      title: "Chernobyl",
      year: "2019",
      posterURL: tmdbPoster("/hlLXt2tOPT6VRuTTQ0Kfo594kwX.jpg"),
      backdropURL: tmdbBackdrop("/aQeZWhw84XgPzHXNLvhEdWpvd6.jpg"),
      overview: "A verdade sobre o desastre nuclear de 1986.",
      mediaType: .tv,
      rating: 8.7,
      genres: ["Drama", "História"],
      director: nil
    ),
  ]

  static let feed: [FeedPost] = [
    FeedPost(
      id: "1",
      username: "marina",
      avatarInitials: "MA",
      caption: "Finalmente assiti. Fincher no auge.",
      visibility: .friends,
      media: movies[0],
      likes: 24,
      comments: 5,
      timeAgo: "2h",
      isShining: true
    ),
    FeedPost(
      id: "2",
      username: "leo.films",
      avatarInitials: "LE",
      caption: "Heath Ledger nunca superado.",
      visibility: .feedPublic,
      media: movies[1],
      likes: 112,
      comments: 18,
      timeAgo: "5h",
      isShining: false
    ),
    FeedPost(
      id: "3",
      username: "sofia",
      avatarInitials: "SO",
      caption: "Rewatch merecido. ★★★★★",
      visibility: .friends,
      media: movies[2],
      likes: 41,
      comments: 3,
      timeAgo: "1d",
      isShining: false
    ),
  ]

  static let lists: [UserList] = [
    UserList(
      id: "l1",
      title: "Noir pra chover",
      subtitle: "Crime, sombra e jazz",
      itemCount: 12,
      isPrivate: false,
      coverURL: movies[2].backdropURL
    ),
    UserList(
      id: "l2",
      title: "Rewatch 2026",
      subtitle: "Privada",
      itemCount: 7,
      isPrivate: true,
      coverURL: movies[0].backdropURL
    ),
    UserList(
      id: "l3",
      title: "Séries curtas",
      subtitle: "Minisséries essenciais",
      itemCount: 5,
      isPrivate: false,
      coverURL: series[2].backdropURL
    ),
  ]

  static let people: [PersonHit] = [
    PersonHit(id: 525, name: "Christopher Nolan", knownFor: "Diretor"),
    PersonHit(id: 287, name: "Brad Pitt", knownFor: "Ator"),
    PersonHit(id: 6193, name: "Leonardo DiCaprio", knownFor: "Ator"),
  ]
}

final class MockCatalogService {
  static let shared = MockCatalogService()
  private init() {}

  func nowShowing() async -> [MediaItem] {
    try? await Task.sleep(nanoseconds: AppConfig.mockDelayNs)
    return Array(MockData.movies.prefix(4))
  }

  func upcoming() async -> [MediaItem] {
    try? await Task.sleep(nanoseconds: AppConfig.mockDelayNs)
    return Array(MockData.movies.suffix(3))
  }

  func popularMovies() async -> [MediaItem] {
    try? await Task.sleep(nanoseconds: AppConfig.mockDelayNs)
    return MockData.movies
  }

  func popularSeries() async -> [MediaItem] {
    try? await Task.sleep(nanoseconds: AppConfig.mockDelayNs)
    return MockData.series
  }

  func feed() async -> [FeedPost] {
    try? await Task.sleep(nanoseconds: AppConfig.mockDelayNs)
    return MockData.feed
  }

  func detail(id: Int) async -> MediaItem? {
    try? await Task.sleep(nanoseconds: AppConfig.mockDelayNs)
    return MockData.movies.first { $0.id == id }
      ?? MockData.series.first { $0.id == id }
  }

  func search(query: String) async -> (movies: [MediaItem], series: [MediaItem], people: [PersonHit]) {
    try? await Task.sleep(nanoseconds: AppConfig.mockDelayNs)
    let q = query.lowercased()
    guard !q.isEmpty else { return ([], [], []) }
    let movies = MockData.movies.filter { $0.title.lowercased().contains(q) }
    let series = MockData.series.filter { $0.title.lowercased().contains(q) }
    let people = MockData.people.filter { $0.name.lowercased().contains(q) }
    return (movies, series, people)
  }
}
