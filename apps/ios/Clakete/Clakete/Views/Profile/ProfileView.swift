import SwiftUI

struct ProfileView: View {
  @State private var strings = L10n.current
  @State private var showPaywall = false
  @State private var segment = 0

  private var session: SessionStore { SessionStore.shared }

  var body: some View {
    ZStack {
      Color.appBackground.ignoresSafeArea()

      ScrollView(showsIndicators: false) {
        VStack(alignment: .leading, spacing: 24) {
          header

          HStack(spacing: 24) {
            stat("128", strings.watched)
            stat("34", strings.watchlist)
            stat("12", strings.lists)
          }

          if !session.isShining {
            Button { showPaywall = true } label: {
              HStack {
                VStack(alignment: .leading, spacing: 4) {
                  Text(strings.shining)
                    .font(.system(size: 15, weight: .semibold))
                  Text("Temas, listas privadas ∞, badge")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.appMuted)
                }
                Spacer()
                Image(systemName: "chevron.right")
                  .foregroundStyle(Color.appMuted)
              }
              .foregroundStyle(Color.appForeground)
              .padding(16)
              .background(Color.appAccentSoft)
              .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.card, style: .continuous))
              .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.card, style: .continuous)
                  .strokeBorder(Color.appAccent.opacity(0.35), lineWidth: 1)
              )
            }
            .buttonStyle(.plain)
          }

          Picker("", selection: $segment) {
            Text(strings.watched).tag(0)
            Text(strings.watchlist).tag(1)
          }
          .pickerStyle(.segmented)

          LazyVGrid(
            columns: [
              GridItem(.flexible(), spacing: 10),
              GridItem(.flexible(), spacing: 10),
              GridItem(.flexible(), spacing: 10),
            ],
            spacing: 12
          ) {
            ForEach(MockData.movies.prefix(6)) { item in
              NavigationLink(value: item) {
                CachedAsyncImage(url: item.posterURL)
                  .aspectRatio(2 / 3, contentMode: .fill)
                  .clipShape(RoundedRectangle(cornerRadius: DesignTokens.CornerRadius.thumbnail, style: .continuous))
              }
              .buttonStyle(.plain)
            }
          }

          if session.isAuthenticated || session.isGuest {
            PrimaryButton(title: session.isAuthenticated ? "Sair (mock)" : strings.signIn, style: .outline) {
              if session.isAuthenticated {
                session.signOut()
              } else {
                session.isGuest = false
                NotificationCenter.default.post(name: .sessionChanged, object: nil)
              }
            }
          }

          languagePicker
        }
        .padding(.horizontal, DesignTokens.Spacing.screenHorizontal)
        .padding(.bottom, 40)
        .padding(.top, 8)
      }
    }
    .navigationBarHidden(true)
    .sheet(isPresented: $showPaywall) {
      PaywallView()
    }
    .onReceive(NotificationCenter.default.publisher(for: .languageChanged)) { _ in
      strings = L10n.current
    }
  }

  private var header: some View {
    HStack(alignment: .center, spacing: 14) {
      Text(String(session.displayName.prefix(2)).uppercased())
        .font(.system(size: 22, weight: .bold))
        .foregroundStyle(.white)
        .frame(width: 72, height: 72)
        .background(
          LinearGradient(colors: [Color.appAccent, Color.appAccent.opacity(0.5)], startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .clipShape(Circle())

      VStack(alignment: .leading, spacing: 6) {
        HStack(spacing: 8) {
          Text(session.displayName)
            .font(.system(size: 22, weight: .semibold))
            .foregroundStyle(Color.appForeground)
          if session.isShining { ShiningBadge() }
        }
        Text("@\(session.username)")
          .font(.system(size: 14))
          .foregroundStyle(Color.appMuted)
        if session.isGuest {
          Text("Modo convidado")
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(Color.appAccent)
        }
      }
      Spacer()
    }
  }

  private func stat(_ value: String, _ label: String) -> some View {
    VStack(spacing: 4) {
      Text(value)
        .font(.system(size: 18, weight: .semibold))
        .foregroundStyle(Color.appForeground)
      Text(label)
        .font(.system(size: 12))
        .foregroundStyle(Color.appMuted)
    }
    .frame(maxWidth: .infinity)
  }

  private var languagePicker: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(strings.language)
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(Color.appMuted)
      Picker("", selection: Binding(
        get: { session.language },
        set: { session.language = $0 }
      )) {
        Text("Português (BR)").tag("pt-BR")
        Text("English").tag("en-US")
        Text("Español").tag("es-ES")
      }
      .pickerStyle(.menu)
      .tint(Color.appAccent)
    }
  }
}
