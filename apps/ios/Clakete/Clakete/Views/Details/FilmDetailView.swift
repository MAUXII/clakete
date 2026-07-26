import SwiftUI

struct FilmDetailView: View {
  let item: MediaItem
  @State private var strings = L10n.current
  @State private var logged = false
  @State private var liked = false
  @State private var inWatchlist = false

  var body: some View {
    ZStack(alignment: .top) {
      Color.appBackground.ignoresSafeArea()

      ScrollView(showsIndicators: false) {
        VStack(alignment: .leading, spacing: 0) {
          hero

          VStack(alignment: .leading, spacing: 20) {
            Text(item.title)
              .font(.system(size: 28, weight: .semibold))
              .foregroundStyle(Color.appForeground)

            HStack(spacing: 10) {
              Text(item.year)
              if let director = item.director {
                Text("·")
                Text(director)
              }
            }
            .font(.system(size: 14))
            .foregroundStyle(Color.appMuted)

            StarRatingView(rating: item.rating)

            actions

            VStack(alignment: .leading, spacing: 8) {
              Text(strings.overview.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .tracking(1.4)
                .foregroundStyle(Color.appMuted)
              Text(item.overview)
                .font(.system(size: 15))
                .foregroundStyle(Color.appMuted)
                .fixedSize(horizontal: false, vertical: true)
            }

            genreRow

            providersMock
          }
          .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
          .padding(.top, 20)
          .padding(.bottom, 48)
        }
      }
    }
    .navigationBarTitleDisplayMode(.inline)
    .toolbarBackground(.hidden, for: .navigationBar)
    .onReceive(NotificationCenter.default.publisher(for: .languageChanged)) { _ in
      strings = L10n.current
    }
  }

  private var hero: some View {
    ZStack(alignment: .bottomLeading) {
      CachedAsyncImage(url: item.backdropURL ?? item.posterURL)
        .frame(height: 280)
        .frame(maxWidth: .infinity)
        .clipped()

      LinearGradient(
        colors: [.clear, Color.appBackground],
        startPoint: .top,
        endPoint: .bottom
      )
      .frame(height: 280)

      HStack(alignment: .bottom, spacing: 14) {
        CachedAsyncImage(url: item.posterURL)
          .frame(width: 100, height: 150)
          .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.thumbnail, style: .continuous))
          .overlay(
            RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.thumbnail, style: .continuous)
              .strokeBorder(Color.appBorder, lineWidth: 1)
          )
          .offset(y: 24)

        Spacer()

        Button {} label: {
          Label(strings.trailer, systemImage: "play.fill")
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color.appAccent)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .padding(.bottom, 12)
      }
      .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
    }
    .padding(.bottom, 28)
  }

  private var actions: some View {
    HStack(spacing: 10) {
      actionChip(
        title: strings.logWatch,
        systemImage: logged ? "checkmark.circle.fill" : "plus.circle",
        active: logged
      ) { logged.toggle() }

      actionChip(
        title: nil,
        systemImage: liked ? "heart.fill" : "heart",
        active: liked
      ) { liked.toggle() }

      actionChip(
        title: nil,
        systemImage: inWatchlist ? "bookmark.fill" : "bookmark",
        active: inWatchlist
      ) { inWatchlist.toggle() }
    }
  }

  private func actionChip(title: String?, systemImage: String, active: Bool, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      HStack(spacing: 6) {
        Image(systemName: systemImage)
        if let title { Text(title) }
      }
      .font(.system(size: 13, weight: .semibold))
      .foregroundStyle(active ? Color.appAccent : Color.appForeground)
      .padding(.horizontal, title == nil ? 12 : 14)
      .padding(.vertical, 10)
      .background(active ? Color.appAccentSoft : Color.white.opacity(0.05))
      .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous)
          .strokeBorder(Color.appBorder, lineWidth: 1)
      )
    }
    .buttonStyle(.plain)
  }

  private var genreRow: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: 8) {
        ForEach(item.genres, id: \.self) { genre in
          Text(genre)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(Color.appAccent)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.appAccentSoft)
            .clipShape(Capsule())
        }
      }
    }
  }

  private var providersMock: some View {
    VStack(alignment: .leading, spacing: 10) {
      Text(strings.whereToWatch.uppercased())
        .font(.system(size: 11, weight: .semibold))
        .tracking(1.4)
        .foregroundStyle(Color.appMuted)

      HStack(spacing: 10) {
        provider("Netflix")
        provider("Prime")
        provider("Max")
      }

      Text("Região: \(SessionStore.shared.watchRegion) · mock UI")
        .font(.system(size: 11))
        .foregroundStyle(Color.appMuted)
    }
    .padding(.top, 8)
  }

  private func provider(_ name: String) -> some View {
    Text(name)
      .font(.system(size: 13, weight: .medium))
      .foregroundStyle(Color.appForeground)
      .padding(.horizontal, 14)
      .padding(.vertical, 10)
      .background(Color.appElevated)
      .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous)
          .strokeBorder(Color.appBorder, lineWidth: 1)
      )
  }
}
