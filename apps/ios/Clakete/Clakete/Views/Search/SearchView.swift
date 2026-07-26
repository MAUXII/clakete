import SwiftUI

struct SearchView: View {
  @State private var strings = L10n.current
  @State private var query = ""
  @State private var movies: [MediaItem] = []
  @State private var series: [MediaItem] = []
  @State private var people: [PersonHit] = []
  @State private var searching = false

  var body: some View {
    ZStack {
      Color.appBackground.ignoresSafeArea()

      VStack(spacing: 0) {
        HStack(spacing: 10) {
          Image(systemName: "magnifyingglass")
            .foregroundStyle(Color.appMuted)
          TextField(strings.searchPlaceholder, text: $query)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .foregroundStyle(Color.appForeground)
          if !query.isEmpty {
            Button {
              query = ""
              movies = []; series = []; people = []
            } label: {
              Image(systemName: "xmark.circle.fill")
                .foregroundStyle(Color.appMuted)
            }
            .buttonStyle(.plain)
          }
        }
        .padding(.horizontal, 14)
        .frame(height: 48)
        .background(Color.appElevated)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous))
        .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
        .padding(.top, 8)
        .padding(.bottom, 16)

        ScrollView(showsIndicators: false) {
          LazyVStack(alignment: .leading, spacing: 24) {
            if searching {
              ProgressView().tint(Color.appAccent).frame(maxWidth: .infinity).padding(.top, 40)
            } else if query.isEmpty {
              Text(strings.searchPlaceholder)
                .font(.system(size: 14))
                .foregroundStyle(Color.appMuted)
                .frame(maxWidth: .infinity)
                .padding(.top, 40)
            } else if movies.isEmpty && series.isEmpty && people.isEmpty {
              Text(strings.noResults)
                .foregroundStyle(Color.appMuted)
                .frame(maxWidth: .infinity)
                .padding(.top, 40)
            } else {
              resultSection(title: strings.films, items: movies)
              resultSection(title: strings.series, items: series)
              if !people.isEmpty {
                Text(strings.people)
                  .font(.system(size: 13, weight: .semibold))
                  .foregroundStyle(Color.appMuted)
                ForEach(people) { person in
                  HStack {
                    Circle()
                      .fill(Color.appAccentSoft)
                      .frame(width: 40, height: 40)
                      .overlay(Text(String(person.name.prefix(1))).foregroundStyle(Color.appAccent))
                    VStack(alignment: .leading) {
                      Text(person.name).foregroundStyle(Color.appForeground)
                      Text(person.knownFor).font(.caption).foregroundStyle(Color.appMuted)
                    }
                    Spacer()
                  }
                }
              }
            }
          }
          .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
          .padding(.bottom, 40)
        }
      }
    }
    .navigationBarHidden(true)
    .onChange(of: query) { _, newValue in
      Task { await runSearch(newValue) }
    }
    .onReceive(NotificationCenter.default.publisher(for: .languageChanged)) { _ in
      strings = L10n.current
    }
  }

  @ViewBuilder
  private func resultSection(title: String, items: [MediaItem]) -> some View {
    if !items.isEmpty {
      Text(title)
        .font(.system(size: 13, weight: .semibold))
        .foregroundStyle(Color.appMuted)
      ForEach(items) { item in
        NavigationLink(value: item) {
          HStack(spacing: 12) {
            CachedAsyncImage(url: item.posterURL)
              .frame(width: 44, height: 66)
              .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
              Text(item.title)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Color.appForeground)
              Text(item.year)
                .font(.system(size: 12))
                .foregroundStyle(Color.appMuted)
            }
            Spacer()
          }
        }
        .buttonStyle(.plain)
      }
    }
  }

  private func runSearch(_ q: String) async {
    let trimmed = q.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else {
      movies = []; series = []; people = []
      return
    }
    searching = true
    let result = await MockCatalogService.shared.search(query: trimmed)
    movies = result.movies
    series = result.series
    people = result.people
    searching = false
  }
}
