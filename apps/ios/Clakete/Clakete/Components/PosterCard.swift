import SwiftUI

struct PosterCard: View {
  let item: MediaItem
  var width: CGFloat = DesignTokens.Size.posterWidth

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      CachedAsyncImage(url: item.posterURL)
        .frame(width: width, height: width * 1.5)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.poster, style: .continuous))
        .overlay(
          RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.poster, style: .continuous)
            .strokeBorder(Color.appBorder, lineWidth: 1)
        )

      Text(item.title)
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(Color.appForeground)
        .lineLimit(2)
        .frame(width: width, alignment: .leading)

      Text(item.year)
        .font(.system(size: 11))
        .foregroundStyle(Color.appMuted)
    }
  }
}
