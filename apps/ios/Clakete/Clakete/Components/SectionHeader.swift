import SwiftUI

struct SectionHeader: View {
  let eyebrow: String?
  let title: String
  var actionTitle: String? = nil
  var action: (() -> Void)? = nil

  var body: some View {
    HStack(alignment: .bottom) {
      VStack(alignment: .leading, spacing: 4) {
        if let eyebrow {
          Text(eyebrow.uppercased())
            .font(.system(size: 11, weight: .medium))
            .tracking(1.6)
            .foregroundStyle(Color.appMuted)
        }
        Text(title)
          .font(.system(size: 22, weight: .semibold))
          .foregroundStyle(Color.appForeground)
      }
      Spacer()
      if let actionTitle, let action {
        Button(actionTitle, action: action)
          .font(.system(size: 13, weight: .medium))
          .foregroundStyle(Color.appMuted)
          .buttonStyle(.plain)
      }
    }
  }
}
