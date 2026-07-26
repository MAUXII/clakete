import SwiftUI

struct LoginView: View {
  @State private var strings = L10n.current
  @State private var email = ""
  @State private var password = ""
  @State private var loading = false
  @State private var showSignUp = false

  var body: some View {
    NavigationStack {
      ZStack {
        Color.appBackground.ignoresSafeArea()

        VStack(spacing: 28) {
          Spacer()

          VStack(spacing: 8) {
            Text("Clakete")
              .font(.system(size: 40, weight: .bold))
              .foregroundStyle(Color.appForeground)
            Text("Diário de cinema")
              .font(.system(size: 15))
              .foregroundStyle(Color.appMuted)
          }

          VStack(spacing: 12) {
            field(strings.email, text: $email, secure: false)
            field(strings.password, text: $password, secure: true)
          }

          PrimaryButton(title: strings.signIn, isLoading: loading) {
            loading = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
              SessionStore.shared.signInMock(email: email.isEmpty ? "demo@clakete.app" : email)
              loading = false
            }
          }

          PrimaryButton(title: strings.signUp, style: .outline) {
            showSignUp = true
          }

          Button(strings.continueAsGuest) {
            SessionStore.shared.continueAsGuest()
          }
          .font(.system(size: 14, weight: .medium))
          .foregroundStyle(Color.appMuted)
          .buttonStyle(.plain)

          Spacer()
        }
        .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
      }
      .navigationDestination(isPresented: $showSignUp) {
        SignUpView()
      }
    }
    .onReceive(NotificationCenter.default.publisher(for: .languageChanged)) { _ in
      strings = L10n.current
    }
  }

  private func field(_ placeholder: String, text: Binding<String>, secure: Bool) -> some View {
    Group {
      if secure {
        SecureField(placeholder, text: text)
      } else {
        TextField(placeholder, text: text)
          .textInputAutocapitalization(.never)
          .keyboardType(.emailAddress)
      }
    }
    .padding(.horizontal, 14)
    .frame(height: 52)
    .foregroundStyle(Color.appForeground)
    .background(Color.appElevated)
    .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.input, style: .continuous)
        .strokeBorder(Color.appBorder, lineWidth: 1)
    )
  }
}
