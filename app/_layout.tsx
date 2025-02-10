import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Suspense, useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SQLiteProvider } from 'expo-sqlite';

import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotifierWrapper } from 'react-native-notifier';
import dalService, { DalContext } from '@/DAL/DALService';
import { View } from 'react-native';
import { runMigrations } from '@/DAL/migrations';
import LoginView from '@/components/general/LoginView';
import DonationView from '@/components/general/DonationView';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLogin, setIsLogin] = useState(true);
  const [shouldRequestDonation, setShouldRequestDonation] = useState(false);
  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = dalService.onAuthStateChanged((authUser) => {
      let isLoggedIn = !!authUser;
      setIsLogin(isLoggedIn);
      if (!isLoggedIn) return;
      let loginCount = dalService.currentUser.loginCount + 1;
      dalService.currentUser.loginCount = loginCount;
      if (loginCount % 50 === 0) setShouldRequestDonation(true);
    });

    // Clean up the listener
    return unsubscribe;
  }, []);
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <Suspense fallback={<View style={{ flex: 1, backgroundColor: "grey" }} />}>
        <SQLiteProvider databaseName="flashLocalDB.db" onInit={runMigrations} useSuspense>
          <DalContext.Provider value={dalService}>
            <NotifierWrapper>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                {
                  !isLogin ?
                    <LoginView /> :
                    shouldRequestDonation ?
                      <DonationView close={() => setShouldRequestDonation(false)} /> :
                      <Stack>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      </Stack>
                }
              </ThemeProvider>
            </NotifierWrapper>
          </DalContext.Provider>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}
