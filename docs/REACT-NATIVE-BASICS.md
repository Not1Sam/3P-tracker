# React Native Basics

This doc covers the concepts you need to understand to edit this codebase.

## What is React Native?

React Native lets you write mobile apps using JavaScript/TypeScript and React. Instead of `<div>` and `<span>`, you use `<View>` and `<Text>`. Instead of CSS, you use `StyleSheet.create()`.

## Core Components

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// View = like <div>
<View style={styles.container}>
  <Text>Hello</Text>
</View>

// Text = like <p> or <span> (all text MUST be in <Text>)
<Text style={styles.title}>Hello World</Text>

// TouchableOpacity = pressable element (like <button>)
<TouchableOpacity onPress={() => console.log('pressed')}>
  <Text>Tap me</Text>
</TouchableOpacity>

// ScrollView = scrollable container (for small lists)
<ScrollView>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</ScrollView>

// FlatList = optimized list (for large lists, virtualizes off-screen items)
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <Text>{item.name}</Text>}
/>
```

## Styles

Styles are JavaScript objects, not CSS. Property names are camelCase:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,                    // takes up all available space
    backgroundColor: '#fff',    // background color
    padding: 16,                // inner spacing
    borderRadius: 12,           // rounded corners
  },
  title: {
    fontSize: 18,               // font size in dp (density-independent pixels)
    fontWeight: '600',          // font weight
    color: '#1E1B4B',          // text color
  },
});
```

### Flexbox (how things are laid out)

```tsx
// Column (default) — items stack vertically
<View style={{ flexDirection: 'column' }}>
  <Text>Top</Text>
  <Text>Bottom</Text>
</View>

// Row — items side by side
<View style={{ flexDirection: 'row' }}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>

// Center everything
<View style={{ justifyContent: 'center', alignItems: 'center' }}>

// Space between
<View style={{ justifyContent: 'space-between' }}>

// Gap between items
<View style={{ gap: 8 }}>
```

## Navigation (Expo Router)

This app uses **Expo Router** which is file-based. The file structure in `app/` = the URL structure.

```tsx
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();

  // Navigate to a screen
  router.push('/settings');

  // Go back
  router.back();

  // Navigate with params
  router.push('/entry/abc123');
}
```

### Dynamic Routes

Files with `[name]` in the filename are dynamic:

```
app/entry/[id].tsx    → matches /entry/anything
app/entry/day/[date].tsx → matches /entry/day/2026-08-16
```

Access the param:
```tsx
import { useLocalSearchParams } from 'expo-router';

function EntryPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // id = 'abc123' for /entry/abc123
}
```

### Tabs

The `(tabs)` group creates a bottom tab bar. Config is in `app/(tabs)/_layout.tsx`:

```tsx
<Tabs>
  <Tabs.Screen name="index" options={{ title: 'Poop', tabBarIcon: ... }} />
  <Tabs.Screen name="explore" options={{ title: 'Piss', tabBarIcon: ... }} />
</Tabs>
```

### Stack Screens

Non-tab screens are pushed on top like a stack of cards. Config in `app/_layout.tsx`:

```tsx
<Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen name="settings" options={{ headerShown: false }} />
</Stack>
```

## State (useState)

State is data the component remembers. When it changes, the UI re-renders.

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0); // [current value, setter function]

  return (
    <TouchableOpacity onPress={() => setCount(count + 1)}>
      <Text>Count: {count}</Text>
    </TouchableOpacity>
  );
}
```

## Effects (useEffect)

Run code when the component mounts or a value changes:

```tsx
import { useEffect } from 'react';

function MyComponent() {
  useEffect(() => {
    // Runs once when component mounts
    loadData();

    return () => {
      // Cleanup (optional) — runs when component unmounts
    };
  }, []); // ← empty array = run once

  useEffect(() => {
    // Runs every time `userId` changes
    fetchUser(userId);
  }, [userId]); // ← dependency array
}
```

## Context (useContext)

Share data across components without prop drilling:

```tsx
// 1. Create context
const MyContext = createContext<string | undefined>(undefined);

// 2. Provider wraps children
function App() {
  const [name, setName] = useState('Sam');
  return (
    <MyContext.Provider value={name}>
      <ChildComponent />
    </MyContext.Provider>
  );
}

// 3. Consumer uses hook
function ChildComponent() {
  const name = useContext(MyContext); // gets 'Sam'
  return <Text>Hello {name}</Text>;
}
```

This app has 4 contexts:
- `AuthContext` — user login state
- `ThemeContext` — light/dark theme
- `ProfileContext` — user profile data
- `NetworkContext` — online/offline state

## Icons (MaterialCommunityIcons)

```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';

<MaterialCommunityIcons name="emoticon-poop" size={24} color="#92400E" />
<MaterialCommunityIcons name="trophy" size={32} color="#8B5CF6" />
<MaterialCommunityIcons name="cog" size={20} color="#7C7A8A" />
```

Browse icons at: https://icons.expo.fyi/

## Animations (Reanimated)

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function AnimatedBox() {
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.box, style]}>
      <TouchableOpacity onPress={() => { scale.value = withSpring(1.2); }}>
        <Text>Press me</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
```

## Themed Components

Every screen uses `useThemeColors()` to get the current theme:

```tsx
import { useThemeColors } from '@/contexts/ThemeContext';

function MyScreen() {
  const colors = useThemeColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
}
```

Key colors: `colors.primary`, `colors.text`, `colors.background`, `colors.surface`, `colors.border`, `colors.poop`, `colors.piss`, `colors.period`.

## Common Patterns

### Auth Gate
```tsx
const { isAuthenticated } = useAuth();

if (!isAuthenticated) {
  return <Text>Login required</Text>;
}
```

### Loading State
```tsx
const [loading, setLoading] = useState(true);

if (loading) return <SkeletonList count={5} />;
```

### Pull to Refresh
```tsx
<FlatList
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
/>
```

### Alert Dialog
```tsx
import { Alert } from 'react-native';

Alert.alert('Title', 'Message', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'OK', onPress: () => doSomething() },
]);
```

### Haptic Feedback
```tsx
import { hapticLight, hapticSuccess } from '@/utils/haptics';

hapticLight();  // light vibration
hapticSuccess(); // success vibration
```

## File Naming Conventions

- **Components**: PascalCase (`EntryCard.tsx`, `AppHeader.tsx`)
- **Screens**: PascalCase + `Screen` suffix (`LoggingScreen.tsx`, `CalendarScreen.tsx`)
- **Services**: kebab-case (`logging-service.ts`, `auth-service.ts`)
- **Repositories**: kebab-case + `-repository` suffix (`poop-repository.ts`)
- **Types**: kebab-case (`logging.ts`, `period.ts`)
- **Constants**: kebab-case (`bristol-chart.ts`, `theme.ts`)
- **Utils**: kebab-case (`date-helpers.ts`, `rate-limiter.ts`)
- **Contexts**: PascalCase + `Context` suffix (`AuthContext.tsx`)
- **Routes**: lowercase (`calendar.tsx`, `settings.tsx`)

## Import Aliases

`@/` maps to `src/`:

```tsx
// Instead of:
import { useAuth } from '../../../contexts/AuthContext';

// Use:
import { useAuth } from '@/contexts/AuthContext';
```
