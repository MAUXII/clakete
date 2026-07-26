import SwiftUI

struct DiscoverView: View {
  @State private var strings = L10n.current
  @State private var segment = 0
  @State private var movies: [MediaItem] = []
  @State private var series: [MediaItem] = []
  @State private var loading = true

  var body: some View {
    ZStack {
      Color.appBackground.ignoresSafeArea()

      GeometryReader { geo in
        let posterWidth = max(90, (geo.size.width - 48 - 24) / 3)

        ScrollView(showsIndicators: false) {
          VStack(alignment: .leading, spacing: 20) {
            Text(strings.navDiscover)
              .font(.system(size: 28, weight: .bold))
              .foregroundStyle(Color.appForeground)

            Picker("", selection: $segment) {
              Text(strings.films).tag(0)
              Text(strings.series).tag(1)
            }
            .pickerStyle(.segmented)

            if loading {
              ProgressView().tint(Color.appAccent).frame(maxWidth: .infinity).padding(.top, 40)
            } else {
              LazyVGrid(
                columns: [
                  GridItem(.flexible(), spacing: 12),
                  GridItem(.flexible(), spacing: 12),
                  GridItem(.flexible(), spacing: 12),
                ],
                spacing: 16
              ) {
                ForEach(segment == 0 ? movies : series) { item in
                  NavigationLink(value: item) {
                    PosterCard(item: item, width: posterWidth)
                  }
                  .buttonStyle(.plain)
                }
              }
            }
          }
          .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
          .padding(.bottom, 40)
          .padding(.top, 8)
        }
      }
    }
    .navigationBarHidden(true)
    .task { await load() }
    .onReceive(NotificationCenter.default.publisher(for: .languageChanged)) { _ in
      strings = L10n.current
    }
  }

  private func load() async {
    loading = true
    async let m = MockCatalogService.shared.popularMovies()
    async let s = MockCatalogService.shared.popularSeries()
    movies = await m
    series = await s
    loading = false
  }
}
