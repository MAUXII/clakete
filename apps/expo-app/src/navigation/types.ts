export type RootStackParamList = {
  Onboarding: undefined
  Login: undefined
  SignUp: undefined
  MainTabs: { screen?: "Home" | "Discover" | "Lists" | "Profile" | "Search" } | undefined
  FilmDetail: { id: number }
}

export type MainTabParamList = {
  Home: undefined
  Discover: undefined
  Lists: undefined
  Profile: undefined
  Search: undefined
}
