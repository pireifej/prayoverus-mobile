import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import AddPrayerScreen from './src/screens/AddPrayerScreen';
import PrayerDetailScreen from './src/screens/PrayerDetailScreen';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366f1',
    secondary: '#f1f5f9',
    background: '#ffffff',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
  },
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Community':
              iconName = 'people';
              break;
            case 'Groups':
              iconName = 'group';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'home';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'My Prayers' }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{ title: 'Community' }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsScreen}
        options={{ title: 'Prayer Groups' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Loading screen could go here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen 
              name="AddPrayer" 
              component={AddPrayerScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitle: 'Add Prayer',
                headerStyle: { backgroundColor: '#6366f1' },
                headerTintColor: '#ffffff',
              }}
            />
            <Stack.Screen 
              name="PrayerDetail" 
              component={PrayerDetailScreen}
              options={{
                headerShown: true,
                headerTitle: 'Prayer Details',
                headerStyle: { backgroundColor: '#6366f1' },
                headerTintColor: '#ffffff',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <AppNavigator />
          <Toast />
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}