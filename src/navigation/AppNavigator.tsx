import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';

import DevPlayground from '../screens/DevPlayground';
import Login from '../screens/Auth/Login';
import Register from '../screens/Auth/Register';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  DevPlayground: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const defaultScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  gestureEnabled: true,
};

interface AppNavigatorProps {
  initialRouteName?: keyof AuthStackParamList;
}

export default function AppNavigator({ initialRouteName = 'Login' }: AppNavigatorProps) {
  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName="Login"
      screenOptions={defaultScreenOptions}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen
        name="DevPlayground"
        component={DevPlayground}
        options={{
          headerShown: true,
          title: 'Dev Playground',
        }}
      />
    </Stack.Navigator>
  );
}
