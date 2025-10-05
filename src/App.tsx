import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import AppNavigator, { AuthStackParamList } from './navigation/AppNavigator';
import { Colors } from './styles/colors';
import { getAuthSession, clearAuthSession } from './utils/storage';
import { setAuthTokenHeader, verifySession } from './api/auth';

type InitialRoute = keyof AuthStackParamList;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
  },
});

const extractStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && !Array.isArray(error) && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
};

export default function App() {
  const [isHydrating, setIsHydrating] = useState(true);
  const [initialRoute, setInitialRoute] = useState<InitialRoute>('Login');

  useEffect(() => {
    let isActive = true;

    const hydrate = async () => {
      let nextRoute: InitialRoute = 'Login';

      try {
        const session = await getAuthSession();

        if (__DEV__) {
          console.log('[app] hydrating session', {
            hasToken: Boolean(session?.token),
            username: session?.username,
            role: session?.role,
          });
        }

        if (session?.token) {
          setAuthTokenHeader(session.token);

          try {
            await verifySession();

            if (__DEV__) {
              console.log('[app] session verified');
            }

            nextRoute = 'DevPlayground';
          } catch (error) {
            if (__DEV__) {
              const message = error instanceof Error ? error.message : 'Unknown error';
              const status = extractStatus(error);
              console.warn('[app] session verification failed', { message, status });
            }

            await clearAuthSession().catch(() => undefined);
            setAuthTokenHeader(null);
          }
        } else {
          setAuthTokenHeader(null);
        }
      } catch (error) {
        if (__DEV__) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.error('[app] session hydration failed', { message });
        }

        await clearAuthSession().catch(() => undefined);
        setAuthTokenHeader(null);
      } finally {
        if (isActive) {
          setInitialRoute(nextRoute);
          setIsHydrating(false);
        }
      }
    };

    hydrate();

    return () => {
      isActive = false;
    };
  }, []);

  if (isHydrating) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator initialRouteName={initialRoute} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}