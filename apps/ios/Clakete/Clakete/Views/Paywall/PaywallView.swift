import SwiftUI

struct PaywallView: View {
  @Environment(\.dismiss) private var dismiss
  @State private var strings = L10n.current

  var body: some View {
    NavigationStack {
      ZStack {
        Color.appBackground.ignoresSafeArea()

        VStack(alignment: .leading, spacing: 24) {
          Text(strings.shining)
            .font(.system(size: 32, weight: .bold))
            .foregroundStyle(Color.appForeground)

          Text("Desbloqueie a experiência completa do Clakete.")
            .font(.system(size: 15))
            .foregroundStyle(Color.appMuted)

          VStack(alignment: .leading, spacing: 14) {
            perk("Listas privadas ilimitadas")
            perk("Temas de perfil (Overlook, Noir, Rose)")
            perk("Badge ✦ nos posts e no perfil")
            perk("Early access a novidades")
          }

          Spacer()

          PrimaryButton(title: "Ativar Shining (mock)") {
            SessionStore.shared.isShining = true
            dismiss()
          }

          PrimaryButton(title: "Agora não", style: .ghost) {
            dismiss()
          }
        }
        .padding(DesignTokens.Spacing.screenHorizontal)
      }
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
          Button { dismiss() } label: {
            Image(systemName: "xmark")
              .foregroundStyle(Color.appMuted)
          }
        }
      }
    }
    .presentationDetents([.medium, .large])
  }

  private func perk(_ text: String) -> some View {
    HStack(spacing: 10) {
      Image(systemName: "checkmark.circle.fill")
        .foregroundStyle(Color.appAccent)
      Text(text)
        .foregroundStyle(Color.appForeground)
      Spacer()
    }
    .font(.system(size: 15))
  }
}
