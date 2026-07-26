import SwiftUI

struct SignUpView: View {
  @State private var strings = L10n.current
  @State private var name = ""
  @State private var email = ""
  @State private var password = ""
  @State private var loading = false

  var body: some View {
    ZStack {
      Color.appBackground.ignoresSafeArea()

      VStack(spacing: 16) {
        Text(strings.signUp)
          .font(.system(size: 28, weight: .bold))
          .foregroundStyle(Color.appForeground)
          .frame(maxWidth: .infinity, alignment: .leading)
          .padding(.bottom, 8)

        field("Nome", text: $name, secure: false)
        field(strings.email, text: $email, secure: false)
        field(strings.password, text: $password, secure: true)

        PrimaryButton(title: strings.continueLabel, isLoading: loading) {
          loading = true
          DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            SessionStore.shared.signUpMock(name: name)
            loading = false
          }
        }

        Spacer()
      }
      .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
      .padding(.top, 16)
    }
    .navigationBarTitleDisplayMode(.inline)
  }

  private func field(_ placeholder: String, text: Binding<String>, secure: Bool) -> some View {
    Group {
      if secure {
        SecureField(placeholder, text: text)
      } else {
        TextField(placeholder, text: text)
          .textInputAutocapitalization(.never)
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
