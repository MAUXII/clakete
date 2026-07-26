import SwiftUI

struct HomeFeedView: View {
  @State private var strings = L10n.current
  @State private var posts: [FeedPost] = []
  @State private var nowShowing: [MediaItem] = []
  @State private var upcoming: [MediaItem] = []
  @State private var loading = true

  var body: some View {
    ZStack {
      Color.appBackground.ignoresSafeArea()

      ScrollView(showsIndicators: false) {
        VStack(alignment: .leading, spacing: DesignTokens.Spacing.section) {
          header

          if loading {
            ProgressView().tint(Color.appAccent).frame(maxWidth: .infinity).padding(.top, 40)
          } else {
            SectionHeader(eyebrow: strings.following, title: strings.activity)

            LazyVStack(spacing: 16) {
              ForEach(posts) { post in
                FeedPostCard(post: post, strings: strings)
              }
            }

            rail(eyebrow: strings.inTheaters, title: strings.nowShowing, items: nowShowing, action: strings.catalogLink)
            rail(eyebrow: strings.comingSoon, title: strings.upcoming, items: upcoming, action: strings.seeAll)
          }
        }
        .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
        .padding(.bottom, 40)
        .padding(.top, 8)
      }
    }
    .navigationBarHidden(true)
    .task { await load() }
    .onReceive(NotificationCenter.default.publisher(for: .languageChanged)) { _ in
      strings = L10n.current
    }
  }

  private var header: some View {
    HStack {
      Text("Clakete")
        .font(.system(size: 28, weight: .bold))
        .foregroundStyle(Color.appForeground)
      Spacer()
      Button {
        NotificationCenter.default.post(name: .navigateToSearch, object: nil)
      } label: {
        Image(systemName: "magnifyingglass")
          .foregroundStyle(Color.appForeground)
          .frame(width: 40, height: 40)
          .background(Color.white.opacity(0.05))
          .clipShape(Circle())
      }
      .buttonStyle(.plain)
    }
  }

  private func rail(eyebrow: String, title: String, items: [MediaItem], action: String) -> some View {
    VStack(alignment: .leading, spacing: 14) {
      SectionHeader(eyebrow: eyebrow, title: title, actionTitle: action)
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 12) {
          ForEach(items) { item in
            NavigationLink(value: item) {
              PosterCard(item: item, width: 96)
            }
            .buttonStyle(.plain)
          }
        }
      }
    }
  }

  private func load() async {
    loading = true
    async let f = MockCatalogService.shared.feed()
    async let n = MockCatalogService.shared.nowShowing()
    async let u = MockCatalogService.shared.upcoming()
    posts = await f
    nowShowing = await n
    upcoming = await u
    loading = false
  }
}
