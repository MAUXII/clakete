import SwiftUI

struct ShiningBadge: View {
  var body: some View {
    Text("✦ The Shining")
      .font(.system(size: 10, weight: .bold))
      .tracking(0.4)
      .foregroundStyle(Color.appAccent)
      .padding(.horizontal, 8)
      .padding(.vertical, 4)
      .background(Color.appAccentSoft)
      .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.badge, style: .continuous))
  }
}
