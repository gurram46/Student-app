import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Input from '../../Input';
import Button from '../../components/Button';
import { login, setAuthTokenHeader, verifySession } from '../../api/auth';
import { Colors } from '../../styles/colors';
import { Typography } from '../../styles/typography';
import { mapAuthError, isIosPlatform } from '../../utils/errorHandler';
import { saveAuthSession } from '../../utils/storage';

interface LoginFormValues {
  username: string;
  password: string;
}

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  DevPlayground: undefined;
};

type AuthNavigation = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface SubmitButtonProps {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
}

const SubmitButton = React.memo(({ onPress, disabled, loading }: SubmitButtonProps) => (
  <View style={styles.submitButtonWrapper}>
    <Button
      title={loading ? 'Signing in...' : 'Sign In'}
      onPress={onPress}
      variant="gold-gradient"
      disabled={disabled}
    />
    {loading ? (
      <View style={styles.buttonSpinner} pointerEvents="none">
        <ActivityIndicator color={Colors.primaryDark} accessibilityLabel="Signing in" />
      </View>
    ) : null}
  </View>
));

SubmitButton.displayName = 'SubmitButton';

const LoginScreen: React.FC = React.memo(() => {
  const navigation = useNavigation<AuthNavigation>();
  const [apiError, setApiError] = useState('');
  const isMountedRef = useRef(true);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormValues>({
    defaultValues: {
      username: '',
      password: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resetErrors = useCallback(() => {
    setApiError('');
    clearErrors();
  }, [clearErrors]);

  const resolveRole = useCallback((user: Record<string, unknown> | undefined): 'student' | 'college' => {
  if (user && typeof user === 'object' && !Array.isArray(user)) {
    const candidate = (user as { role?: unknown }).role;
    if (typeof candidate === 'string') {
      const normalized = candidate.toLowerCase().trim();
      if (normalized === 'college' || normalized === 'student') {
        return normalized as 'student' | 'college';
      }
    }
  }

  return 'student';
}, []);

const onSubmit = useCallback(
  async (values: LoginFormValues) => {
    setApiError('');

    try {
      const sanitizedUsername = values.username.trim();

      if (__DEV__) {
        console.log('[login-screen] attempting sign-in', { username: sanitizedUsername });
      }

      const response = await login({
        username: sanitizedUsername,
        password: values.password,
      });

      if (!response || !response.token) {
        throw new Error('Invalid response from authentication service.');
      }

      const resolvedRole = resolveRole(response.user);

      await saveAuthSession({
        token: response.token,
        role: resolvedRole,
        username: sanitizedUsername,
        user: response.user,
      });

      setAuthTokenHeader(response.token);

      try {
        await verifySession();
      } catch (verifyError) {
        if (__DEV__) {
          console.warn('[login-screen] session verification warning', verifyError);
        }
      }

      if (isMountedRef.current) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'DevPlayground' }],
        });
      }
    } catch (error) {
      const message = mapAuthError(error, 'Unable to sign in. Check your details and try again.');
      if (isMountedRef.current) {
        setApiError(message);
        setError('password', { message });
      }
    }
  },
  [navigation, resolveRole, setError],
);

  const usernameRules = useMemo(
    () => ({
      required: 'Username is required.',
      minLength: {
        value: 3,
        message: 'Username must contain at least 3 characters.',
      },
      validate: (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'Username is required.';
        }
        if (trimmed.includes(' ')) {
          return 'Username cannot contain spaces.';
        }
        return true;
      },
    }),
    [],
  );

  const passwordRules = useMemo(
    () => ({
      required: 'Password is required.',
      minLength: {
        value: 6,
        message: 'Password must be at least 6 characters long.',
      },
    }),
    [],
  );

  const handleRegisterNavigation = useCallback(() => {
    navigation.navigate('Register');
  }, [navigation]);

  const behavior = isIosPlatform() ? 'padding' : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={behavior} keyboardVerticalOffset={24}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            accessibilityLabel="Login screen"
          >
            <Text style={styles.title} accessibilityRole="header">
              Welcome Back
            </Text>
            <Text style={styles.subtitle}>
              Sign in with your credentials to continue learning.
            </Text>

            {apiError ? (
              <View style={styles.errorBanner} accessibilityLiveRegion="polite">
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <Controller
                control={control}
                name="username"
                rules={usernameRules}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={(text) => {
                      resetErrors();
                      onChange(text);
                    }}
                    onBlur={onBlur}
                    placeholder="Enter username"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                    error={errors.username?.message}
                    testID="login-username-input"
                    accessibilityLabel="Username"
                  />
                )}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <Controller
                control={control}
                name="password"
                rules={passwordRules}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={(text) => {
                      resetErrors();
                      onChange(text);
                    }}
                    onBlur={onBlur}
                    placeholder="Enter password"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={errors.password?.message}
                    testID="login-password-input"
                    accessibilityLabel="Password"
                  />
                )}
              />
            </View>

            <SubmitButton
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              loading={isSubmitting}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account yet?</Text>
              <Button
                title="Create Account"
                onPress={handleRegisterNavigation}
                variant="outline"
                disabled={isSubmitting}
                style={styles.secondaryButton}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});

LoginScreen.displayName = 'LoginScreen';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  title: {
    fontSize: Typography.largeTitle,
    fontWeight: Typography.bold,
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.bodyText,
    color: Colors.secondaryDark,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: Typography.smallText,
    fontWeight: Typography.medium,
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  submitButtonWrapper: {
    marginTop: 8,
    marginBottom: 24,
  },
  buttonSpinner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 'auto',
  },
  footerText: {
    fontSize: Typography.bodyText,
    color: Colors.primaryDark,
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 12,
  },
  errorBanner: {
    backgroundColor: Colors.redOrange,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    color: Colors.white,
    fontSize: Typography.smallText,
  },
});

export default LoginScreen;