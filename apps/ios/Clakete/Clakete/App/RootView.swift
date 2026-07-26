import SwiftUI

/// Gate: onboarding → tabs (auth/guest) → login.
struct RootView: View {
  @State private var isAuthenticated = SessionStore.shared.isAuthenticated
  @State private var isGuest = SessionStore.shared.isGuest
  @State private var hasCompletedOnboarding = SessionStore.shared.hasCompletedOnboarding

  var body: some View {
    Group {
      if !hasCompletedOnboarding && !isAuthenticated {
        OnboardingView()
      } else if isAuthenticated || isGuest {
        MainTabView()
      } else {
        LoginView()
      }
    }
    .background(Color.appBackground.ignoresSafeArea())
    .onReceive(NotificationCenter.default.publisher(for: .sessionChanged)) { _ in
      isAuthenticated = SessionStore.shared.isAuthenticated
      isGuest = SessionStore.shared.isGuest
      hasCompletedOnboarding = SessionStore.shared.hasCompletedOnboarding
    }
  }
}

#Preview {
  RootView()
}
