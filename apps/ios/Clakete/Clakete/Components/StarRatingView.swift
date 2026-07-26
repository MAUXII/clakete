import SwiftUI

struct StarRatingView: View {
  var rating: Double
  var max: Double = 10

  var body: some View {
    HStack(spacing: 2) {
      ForEach(0..<5, id: \.self) { i in
        Image(systemName: starName(for: i))
          .font(.system(size: 12))
          .foregroundStyle(Color.appStar)
      }
      Text(String(format: "%.1f", rating))
        .font(.system(size: 12, weight: .medium))
        .foregroundStyle(Color.appMuted)
        .padding(.leading, 4)
    }
  }

  private func starName(for index: Int) -> String {
    let stars = (rating / max) * 5
    if Double(index) + 0.75 <= stars { return "star.fill" }
    if Double(index) + 0.25 <= stars { return "star.leadinghalf.filled" }
    return "star"
  }
}
