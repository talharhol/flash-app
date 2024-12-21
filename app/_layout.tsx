import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Suspense, useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';


import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotifierWrapper } from 'react-native-notifier';
import dalService, { DalContext } from '@/DAL/DALService';
import { View } from 'react-native';
import { runMigrations } from '@/DAL/migrations';
import LoginModal from '@/components/general/modals/LoginModal';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLogin, setIsLogin] = useState(true);
  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = dalService.onAuthStateChanged((authUser) => {
      setIsLogin(!!authUser);
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
      <Suspense fallback={<View style={{ flex: 1, backgroundColor: "red" }} />}>
        <SQLiteProvider databaseName="flashLocalDB.db" onInit={runMigrations} useSuspense>
          <DalContext.Provider value={dalService}>
            { !isLogin && <LoginModal closeModal={() => setIsLogin(true)}/> }
            <NotifierWrapper>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </ThemeProvider>
            </NotifierWrapper>
          </DalContext.Provider>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}
