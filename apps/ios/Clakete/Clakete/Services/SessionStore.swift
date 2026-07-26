import Foundation

/// Sessão local (front-only). Trocar por Supabase depois.
final class SessionStore {
  static let shared = SessionStore()
  private init() {}

  private let defaults = UserDefaults.standard

  var isAuthenticated: Bool {
    get { defaults.bool(forKey: "isAuthenticated") }
    set {
      defaults.set(newValue, forKey: "isAuthenticated")
      notify()
    }
  }

  var isGuest: Bool {
    get { defaults.bool(forKey: "isGuest") }
    set {
      defaults.set(newValue, forKey: "isGuest")
      notify()
    }
  }

  var hasCompletedOnboarding: Bool {
    get { defaults.bool(forKey: "hasCompletedOnboarding") }
    set {
      defaults.set(newValue, forKey: "hasCompletedOnboarding")
      notify()
    }
  }

  var displayName: String {
    get { defaults.string(forKey: "displayName") ?? "cinefilo" }
    set { defaults.set(newValue, forKey: "displayName") }
  }

  var username: String {
    get { defaults.string(forKey: "username") ?? "cinefilo" }
    set { defaults.set(newValue, forKey: "username") }
  }

  var language: String {
    get { defaults.string(forKey: "language") ?? "pt-BR" }
    set {
      defaults.set(newValue, forKey: "language")
      NotificationCenter.default.post(name: .languageChanged, object: nil)
    }
  }

  var watchRegion: String {
    get { defaults.string(forKey: "watchRegion") ?? "BR" }
    set { defaults.set(newValue, forKey: "watchRegion") }
  }

  var isShining: Bool {
    get { defaults.bool(forKey: "isShining") }
    set { defaults.set(newValue, forKey: "isShining"); notify() }
  }

  func signInMock(email: String) {
    username = email.split(separator: "@").first.map(String.init) ?? "user"
    displayName = username
    isAuthenticated = true
    isGuest = false
    hasCompletedOnboarding = true
  }

  func signUpMock(name: String) {
    displayName = name.isEmpty ? "cinefilo" : name
    username = displayName.lowercased().replacingOccurrences(of: " ", with: "")
    isAuthenticated = true
    isGuest = false
    hasCompletedOnboarding = true
  }

  func continueAsGuest() {
    isGuest = true
    isAuthenticated = false
    hasCompletedOnboarding = true
  }

  func completeOnboarding(name: String, region: String, language: String) {
    displayName = name.isEmpty ? "cinefilo" : name
    username = displayName.lowercased().replacingOccurrences(of: " ", with: "")
    watchRegion = region
    self.language = language
    hasCompletedOnboarding = true
    isGuest = true
  }

  func signOut() {
    isAuthenticated = false
    isGuest = false
  }

  private func notify() {
    NotificationCenter.default.post(name: .sessionChanged, object: nil)
  }
}
