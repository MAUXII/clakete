import { NavigationContainer, DarkTheme } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Text } from "react-native"
import { useSession } from "../session"
import { colors } from "../theme"
import { OnboardingScreen } from "../screens/OnboardingScreen"
import { LoginScreen } from "../screens/LoginScreen"
import { SignUpScreen } from "../screens/SignUpScreen"
import { HomeScreen } from "../screens/HomeScreen"
import { DiscoverScreen } from "../screens/DiscoverScreen"
import { ListsScreen } from "../screens/ListsScreen"
import { ProfileScreen } from "../screens/ProfileScreen"
import { SearchScreen } from "../screens/SearchScreen"
import { FilmDetailScreen } from "../screens/FilmDetailScreen"
import type { MainTabParamList, RootStackParamList } from "./types"

const RootStack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()
const HomeStack = createNativeStackNavigator()
const DiscoverStack = createNativeStackNavigator()
const ProfileStack = createNativeStackNavigator()
const SearchStack = createNativeStackNavigator()

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.foreground,
    border: colors.border,
    primary: colors.accent,
  },
}

const stackScreenOpts = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.foreground,
  contentStyle: { backgroundColor: colors.background },
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.accent : colors.muted, fontSize: 14, fontWeight: "600" }}>
      {label}
    </Text>
  )
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOpts}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="FilmDetail" component={FilmDetailScreen} options={{ title: "" }} />
    </HomeStack.Navigator>
  )
}

function DiscoverStackScreen() {
  return (
    <DiscoverStack.Navigator screenOptions={stackScreenOpts}>
      <DiscoverStack.Screen name="DiscoverMain" component={DiscoverScreen} options={{ headerShown: false }} />
      <DiscoverStack.Screen name="FilmDetail" component={FilmDetailScreen} options={{ title: "" }} />
    </DiscoverStack.Navigator>
  )
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOpts}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="FilmDetail" component={FilmDetailScreen} options={{ title: "" }} />
    </ProfileStack.Navigator>
  )
}

function SearchStackScreen() {
  return (
    <SearchStack.Navigator screenOptions={stackScreenOpts}>
      <SearchStack.Screen name="SearchMain" component={SearchScreen} options={{ headerShown: false }} />
      <SearchStack.Screen name="FilmDetail" component={FilmDetailScreen} options={{ title: "" }} />
    </SearchStack.Navigator>
  )
}

function MainTabs() {
  const { strings } = useSession()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarLabel: strings.navHome,
          tabBarIcon: ({ focused }) => <TabIcon label="⌂" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverStackScreen}
        options={{
          tabBarLabel: strings.navDiscover,
          tabBarIcon: ({ focused }) => <TabIcon label="✦" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Lists"
        component={ListsScreen}
        options={{
          tabBarLabel: strings.navLists,
          tabBarIcon: ({ focused }) => <TabIcon label="☰" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: strings.navProfile,
          tabBarIcon: ({ focused }) => <TabIcon label="☺" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackScreen}
        options={{
          tabBarLabel: strings.navSearch,
          tabBarIcon: ({ focused }) => <TabIcon label="⌕" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  )
}

export function RootNavigator() {
  const session = useSession()

  if (!session.ready) return null

  const inApp = session.isAuthenticated || session.isGuest

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {!session.hasCompletedOnboarding && !session.isAuthenticated ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : inApp ? (
          <RootStack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <>
            <RootStack.Screen name="Login">
              {({ navigation }) => <LoginScreen onSignUp={() => navigation.navigate("SignUp")} />}
            </RootStack.Screen>
            <RootStack.Screen name="SignUp">
              {({ navigation }) => <SignUpScreen onBack={() => navigation.goBack()} />}
            </RootStack.Screen>
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  )
}
