import SwiftUI

/// Placeholder tipado — depois trocar por cache Kingfisher.
struct CachedAsyncImage: View {
  let url: URL?
  var contentMode: ContentMode = .fill

  var body: some View {
    Group {
      if let url {
        AsyncImage(url: url) { phase in
          switch phase {
          case .success(let image):
            image
              .resizable()
              .aspectRatio(contentMode: contentMode)
          case .failure:
            placeholder
          case .empty:
            ProgressView()
              .tint(Color.appMuted)
              .frame(maxWidth: .infinity, maxHeight: .infinity)
              .background(Color.appElevated)
          @unknown default:
            placeholder
          }
        }
      } else {
        placeholder
      }
    }
  }

  private var placeholder: some View {
    ZStack {
      Color.appElevated
      Image(systemName: "film")
        .foregroundStyle(Color.appMuted)
    }
  }
}
