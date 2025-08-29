import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';

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

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="light" backgroundColor="#6366f1" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#6366f1' },
              headerTintColor: '#ffffff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
            <Stack.Screen 
              name="(tabs)" 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="login" 
              options={{ 
                title: 'Welcome to PrayOverUs',
                headerShown: false 
              }} 
            />
            <Stack.Screen 
              name="add-prayer" 
              options={{ 
                title: 'Add Prayer',
                presentation: 'modal' 
              }} 
            />
          </Stack>
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}