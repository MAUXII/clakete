import SwiftUI

struct ListsView: View {
  @State private var strings = L10n.current
  @State private var segment = 0

  private var lists: [UserList] {
    segment == 0
      ? MockData.lists
      : MockData.lists.filter { !$0.isPrivate }
  }

  var body: some View {
    ZStack {
      Color.appBackground.ignoresSafeArea()

      ScrollView(showsIndicators: false) {
        VStack(alignment: .leading, spacing: 20) {
          HStack {
            Text(strings.navLists)
              .font(.system(size: 28, weight: .bold))
              .foregroundStyle(Color.appForeground)
            Spacer()
            Button {} label: {
              Image(systemName: "plus")
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(Color.appAccent)
                .clipShape(Circle())
            }
            .buttonStyle(.plain)
          }

          Picker("", selection: $segment) {
            Text(strings.yourLists).tag(0)
            Text(strings.publicLists).tag(1)
          }
          .pickerStyle(.segmented)

          ForEach(lists) { list in
            listRow(list)
          }
        }
        .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
        .padding(.bottom, 40)
        .padding(.top, 8)
      }
    }
    .navigationBarHidden(true)
    .onReceive(NotificationCenter.default.publisher(for: .languageChanged)) { _ in
      strings = L10n.current
    }
  }

  private func listRow(_ list: UserList) -> some View {
    HStack(spacing: 14) {
      CachedAsyncImage(url: list.coverURL)
        .frame(width: 72, height: 72)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.thumbnail, style: .continuous))

      VStack(alignment: .leading, spacing: 4) {
        HStack(spacing: 6) {
          Text(list.title)
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(Color.appForeground)
          if list.isPrivate {
            Image(systemName: "lock.fill")
              .font(.system(size: 10))
              .foregroundStyle(Color.appMuted)
          }
        }
        Text(list.subtitle)
          .font(.system(size: 13))
          .foregroundStyle(Color.appMuted)
        Text("\(list.itemCount) títulos")
          .font(.system(size: 12))
          .foregroundStyle(Color.appMuted)
      }
      Spacer()
      Image(systemName: "chevron.right")
        .font(.system(size: 12, weight: .semibold))
        .foregroundStyle(Color.appMuted)
    }
    .padding(12)
    .background(Color.appElevated)
    .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.card, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.card, style: .continuous)
        .strokeBorder(Color.appBorder, lineWidth: 1)
    )
  }
}
