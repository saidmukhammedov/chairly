import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function RootLayoutNav() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return null; // Splash screen stays visible via expo-splash-screen
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="shop/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerTransparent: true,
            headerTintColor: '#1A1A1A',
          }}
        />
        <Stack.Screen
          name="booking/index"
          options={{
            headerShown: true,
            headerTitle: 'Book Appointment',
            headerBackTitle: 'Back',
            headerTintColor: '#1A1A1A',
            headerStyle: { backgroundColor: '#FBF9F5' },
          }}
        />
        <Stack.Screen
          name="appointment/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Appointment',
            headerBackTitle: 'Back',
            headerTintColor: '#1A1A1A',
            headerStyle: { backgroundColor: '#FBF9F5' },
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
