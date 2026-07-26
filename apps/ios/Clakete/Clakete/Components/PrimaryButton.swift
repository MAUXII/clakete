import SwiftUI

struct PrimaryButton: View {
  let title: String
  var style: Style = .filled
  var isLoading: Bool = false
  let action: () -> Void

  enum Style {
    case filled, outline, ghost
  }

  var body: some View {
    Button(action: action) {
      ZStack {
        if isLoading {
          ProgressView().tint(style == .filled ? .white : Color.appAccent)
        } else {
          Text(title)
            .font(.system(size: 16, weight: .semibold))
        }
      }
      .frame(maxWidth: .infinity)
      .frame(height: DesignTokens.Size.buttonHeight)
      .foregroundStyle(foreground)
      .background(background)
      .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous)
          .strokeBorder(border, lineWidth: style == .outline ? 1 : 0)
      )
    }
    .disabled(isLoading)
    .buttonStyle(.plain)
  }

  private var foreground: Color {
    switch style {
    case .filled: return .white
    case .outline, .ghost: return Color.appForeground
    }
  }

  private var background: Color {
    switch style {
    case .filled: return Color.appAccent
    case .outline: return .clear
    case .ghost: return Color.white.opacity(0.04)
    }
  }

  private var border: Color {
    style == .outline ? Color.appBorder : .clear
  }
}
