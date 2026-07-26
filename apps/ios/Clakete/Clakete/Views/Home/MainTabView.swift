import SwiftUI

struct MainTabView: View {
  @State private var selectedTab = 0
  @State private var strings = L10n.current

  var body: some View {
    TabView(selection: $selectedTab) {
      NavigationStack {
        HomeFeedView()
          .navigationDestination(for: MediaItem.self) { item in
            FilmDetailView(item: item)
          }
      }
      .tabItem { Label(strings.navHome, systemImage: "house.fill") }
      .tag(0)

      NavigationStack {
        DiscoverView()
          .navigationDestination(for: MediaItem.self) { item in
            FilmDetailView(item: item)
          }
      }
      .tabItem { Label(strings.navDiscover, systemImage: "sparkles") }
      .tag(1)

      NavigationStack {
        ListsView()
      }
      .tabItem { Label(strings.navLists, systemImage: "list.bullet.rectangle") }
      .tag(2)

      NavigationStack {
        ProfileView()
          .navigationDestination(for: MediaItem.self) { item in
            FilmDetailView(item: item)
          }
      }
      .tabItem { Label(strings.navProfile, systemImage: "person.fill") }
      .tag(3)

      NavigationStack {
        SearchView()
          .navigationDestination(for: MediaItem.self) { item in
            FilmDetailView(item: item)
          }
      }
      .tabItem { Label(strings.navSearch, systemImage: "magnifyingglass") }
      .tag(4)
    }
    .tint(Color.appAccent)
    .onReceive(NotificationCenter.default.publisher(for: .languageChanged)) { _ in
      strings = L10n.current
    }
    .onReceive(NotificationCenter.default.publisher(for: .navigateToSearch)) { _ in
      selectedTab = 4
    }
  }
}
