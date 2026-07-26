import SwiftUI

struct FeedPostCard: View {
  let post: FeedPost
  let strings: L10n

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack(spacing: 10) {
        Text(post.avatarInitials)
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(.white)
          .frame(width: 36, height: 36)
          .background(Color.appAccentSoft)
          .clipShape(Circle())
          .overlay(Circle().strokeBorder(Color.appBorder, lineWidth: 1))

        VStack(alignment: .leading, spacing: 2) {
          HStack(spacing: 6) {
            Text(post.username)
              .font(.system(size: 14, weight: .semibold))
              .foregroundStyle(Color.appForeground)
            if post.isShining {
              Text("✦")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Color.appAccent)
            }
          }
          Text(post.timeAgo)
            .font(.system(size: 11))
            .foregroundStyle(Color.appMuted)
        }

        Spacer()

        Text(post.visibility == .friends ? strings.friends : strings.feedPublic)
          .font(.system(size: 10, weight: .semibold))
          .tracking(0.6)
          .textCase(.uppercase)
          .foregroundStyle(Color.appMuted)
          .padding(.horizontal, 8)
          .padding(.vertical, 4)
          .background(Color.white.opacity(0.04))
          .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.badge, style: .continuous))
      }

      NavigationLink(value: post.media) {
        CachedAsyncImage(url: post.media.backdropURL ?? post.media.posterURL)
          .frame(height: 200)
          .frame(maxWidth: .infinity)
          .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.card, style: .continuous))
          .overlay(
            RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.card, style: .continuous)
              .strokeBorder(Color.appBorder, lineWidth: 1)
          )
          .overlay(alignment: .bottomLeading) {
            Text(post.media.title)
              .font(.system(size: 15, weight: .semibold))
              .foregroundStyle(.white)
              .padding(14)
              .shadow(radius: 8)
          }
      }
      .buttonStyle(.plain)

      Text(post.caption)
        .font(.system(size: 14))
        .foregroundStyle(Color.appForeground)
        .fixedSize(horizontal: false, vertical: true)

      HStack(spacing: 18) {
        Label("\(post.likes)", systemImage: "heart")
        Label("\(post.comments)", systemImage: "bubble.right")
        Spacer()
      }
      .font(.system(size: 13))
      .foregroundStyle(Color.appMuted)
    }
    .padding(16)
    .background(Color.appElevated)
    .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.card, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.card, style: .continuous)
        .strokeBorder(Color.appBorder, lineWidth: 1)
    )
  }
}
