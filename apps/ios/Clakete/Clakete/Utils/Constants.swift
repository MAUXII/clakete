import Foundation

enum AppConfig {
  /// Front-only: sem backend. Depois aponta pro Next deploy.
  static let apiBaseURL = "https://clakete.app"
  static let mockDelayNs: UInt64 = 350_000_000
}
