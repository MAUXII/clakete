import SwiftUI

struct OnboardingView: View {
  @State private var strings = L10n.current
  @State private var name = ""
  @State private var region = "BR"
  @State private var language = "pt-BR"
  @State private var step = 0

  private let regions = ["BR", "US", "PT", "MX", "ES"]
  private let languages = ["pt-BR", "en-US", "es-ES", "pt-PT"]

  var body: some View {
    ZStack {
      Color.appBackground.ignoresSafeArea()

      VStack(spacing: 0) {
        HStack(spacing: 6) {
          ForEach(0..<2, id: \.self) { i in
            Capsule()
              .fill(i <= step ? Color.appAccent : Color.white.opacity(0.12))
              .frame(height: 3)
          }
        }
        .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
        .padding(.top, 16)

        Spacer()

        Group {
          if step == 0 {
            welcomeStep
          } else {
            prefsStep
          }
        }
        .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)

        Spacer()

        VStack(spacing: 12) {
          PrimaryButton(title: strings.continueLabel) {
            if step == 0 {
              withAnimation { step = 1 }
            } else {
              SessionStore.shared.completeOnboarding(
                name: name,
                region: region,
                language: language
              )
            }
          }

          if step == 0 {
            Button(strings.skip) {
              SessionStore.shared.completeOnboarding(name: "cinefilo", region: "BR", language: "pt-BR")
            }
            .font(.system(size: 14, weight: .medium))
            .foregroundStyle(Color.appMuted)
            .buttonStyle(.plain)
          }
        }
        .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
        .padding(.bottom, 36)
      }
    }
    .onChange(of: language) { _, newValue in
      SessionStore.shared.language = newValue
      strings = L10n.current
    }
  }

  private var welcomeStep: some View {
    VStack(spacing: 16) {
      Text("Clakete")
        .font(.system(size: 44, weight: .bold))
        .foregroundStyle(Color.appForeground)
      Text("Seu diário de cinema — feed, listas e onde assistir.")
        .font(.system(size: 16))
        .foregroundStyle(Color.appMuted)
        .multilineTextAlignment(.center)
    }
  }

  private var prefsStep: some View {
    VStack(alignment: .leading, spacing: 20) {
      Text(strings.onboardingTitle)
        .font(.system(size: 28, weight: .semibold))
        .foregroundStyle(Color.appForeground)
      Text(strings.onboardingHint)
        .font(.system(size: 14))
        .foregroundStyle(Color.appMuted)

      TextField("Nome", text: $name)
        .padding(.horizontal, 14)
        .frame(height: 52)
        .foregroundStyle(Color.appForeground)
        .background(Color.appElevated)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous))
        .overlay(
          RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous)
            .strokeBorder(Color.appBorder, lineWidth: 1)
        )

      labeledPicker(strings.watchRegion, selection: $region, options: regions)
      labeledPicker(strings.language, selection: $language, options: languages)
    }
  }

  private func labeledPicker(_ title: String, selection: Binding<String>, options: [String]) -> some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(title)
        .font(.system(size: 13))
        .foregroundStyle(Color.appMuted)
      Picker(title, selection: selection) {
        ForEach(options, id: \.self) { Text($0).tag($0) }
      }
      .pickerStyle(.menu)
      .tint(Color.appAccent)
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(.horizontal, 12)
      .frame(height: 48)
      .background(Color.appElevated)
      .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous))
    }
  }
}
