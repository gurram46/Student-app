import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Pressable,
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
import { register as registerUser, login as loginUser, getStates, StateOption, setAuthTokenHeader, verifySession } from '../../api/auth';
import { Colors } from '../../styles/colors';
import { Typography } from '../../styles/typography';
import { mapAuthError, isIosPlatform } from '../../utils/errorHandler';
import { saveAuthSession } from '../../utils/storage';


interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  city: string;
  state: string;
}

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  DevPlayground: undefined;
};

type AuthNavigation = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface SubmitButtonProps {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
}

const SubmitButton = React.memo(({ onPress, disabled, loading }: SubmitButtonProps) => {
  const handlePress = useCallback(() => {
    if (__DEV__) {
      console.log('[register-screen] submit button pressed', { disabled, loading });
    }
    if (!disabled) {
      onPress();
    }
  }, [disabled, loading, onPress]);

  return (
    <View style={styles.submitButtonWrapper}>
      <Button
        title={loading ? 'Creating account...' : 'Create Account'}
        onPress={handlePress}
        variant="gold-gradient"
        disabled={disabled}
        accessibilityLabel="Create account"
      />
      {loading ? (
        <View style={styles.buttonSpinner} pointerEvents="none">
          <ActivityIndicator color={Colors.primaryDark} accessibilityLabel="Creating account" />
        </View>
      ) : null}
    </View>
  );
});

SubmitButton.displayName = 'SubmitButton';

type SelectFieldOption = StateOption;

interface SelectFieldProps {
  label: string;
  value: string;
  placeholder: string;
  options: ReadonlyArray<SelectFieldOption>;
  onSelect: (value: string) => void;
  error?: string;
  testID?: string;
  loading?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = React.memo(
  ({ label, value, placeholder, options, onSelect, error, testID, loading }) => {
    const [visible, setVisible] = useState(false);

    const open = useCallback(() => {
      Keyboard.dismiss();
      setVisible(true);
    }, []);

    const close = useCallback(() => {
      setVisible(false);
    }, []);

    const handleSelection = useCallback(
      (selected: string) => {
        onSelect(selected);
        setVisible(false);
      },
      [onSelect],
    );

    const selectedLabel = useMemo(() => {
      const match = options.find((option) => option.value === value);
      return match?.label ?? '';
    }, [options, value]);

    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          style={[styles.selectTrigger, error ? styles.selectTriggerError : null]}
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={label}
          testID={testID}
        >
          <Text style={value ? styles.selectValueText : styles.selectPlaceholderText}>
            {selectedLabel || placeholder}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : (
            <Text style={styles.selectIndicator}>v</Text>
          )}
        </Pressable>
        {error ? (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
          <View style={styles.modalWrapper}>
            <Pressable
              style={styles.modalBackground}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel={`Close ${label} selector`}
            />
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{label}</Text>
              <ScrollView keyboardShouldPersistTaps="handled">
                {options.length === 0 ? (
                  <Text style={styles.modalEmptyText}>No options available.</Text>
                ) : (
                  options.map((option) => (
                    <Pressable
                      key={option.value}
                      style={styles.modalOption}
                      onPress={() => handleSelection(option.value)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${option.label}`}
                    >
                      <Text style={styles.modalOptionText}>{option.label}</Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
              <Button title="Close" onPress={close} variant="outline" style={styles.modalCloseButton} />
            </View>
          </View>
        </Modal>
      </View>
    );
  },
);

SelectField.displayName = 'SelectField';

const RegisterScreen: React.FC = React.memo(() => {
  const navigation = useNavigation<AuthNavigation>();
  const [apiError, setApiError] = useState('');
  const [states, setStates] = useState<ReadonlyArray<StateOption>>(() => []);
  const [statesLoading, setStatesLoading] = useState(false);
  const [stateFetchError, setStateFetchError] = useState('');
  const isMountedRef = useRef(true);
  const statesControllerRef = useRef<AbortController | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
    setValue,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      city: '',
      state: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      statesControllerRef.current?.abort();
      statesControllerRef.current = null;
    };
  }, []);

  const resetErrors = useCallback(
    (field?: keyof RegisterFormValues) => {
      setApiError('');
      if (field) {
        clearErrors(field);
      } else {
        clearErrors();
      }
    },
    [clearErrors],
  );

  const loadStates = useCallback(async () => {
    statesControllerRef.current?.abort();
    const controller = new AbortController();
    statesControllerRef.current = controller;
    setStatesLoading(true);
    setStateFetchError('');

    try {
      const fetchedStates = await getStates(controller.signal);
      if (isMountedRef.current) {
        setStates(fetchedStates);
        setStateFetchError('');
      }
    } catch (error) {
      if (isMountedRef.current) {
        setStateFetchError(mapAuthError(error, 'Unable to load states. Tap reload.'));
      }
    } finally {
      if (isMountedRef.current) {
        setStatesLoading(false);
      }
      statesControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    loadStates();
  }, [loadStates]);

  
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
  async (values: RegisterFormValues) => {
    setApiError('');
    const { confirmPassword, phoneNumber, ...rest } = values;
    const sanitizedPhone = phoneNumber.replace(/\D/g, '').trim();

    if (sanitizedPhone.length < 10) {
      setError('phoneNumber', { message: 'Phone number must be at least 10 digits.' });
      return;
    }

    clearErrors('phoneNumber');

    if (values.password !== confirmPassword) {
      setError('confirmPassword', { message: 'Passwords must match.' });
      return;
    }

    if (__DEV__) {
      console.log('[register-screen] validation passed', { sanitizedPhoneLength: sanitizedPhone.length });
    }

    const sanitizedUsername = rest.username.trim();

    try {
      const payloadForApi = {
        firstName: rest.firstName.trim(),
        lastName: rest.lastName.trim(),
        email: rest.email.trim().toLowerCase(),
        username: sanitizedUsername,
        password: values.password,
        role: 'student' as const,
        phoneNumber: sanitizedPhone,
        city: rest.city.trim(),
        state: rest.state,
        collegeLogo: '',
      };

      if (__DEV__) {
        const { password: _password, ...debugPayload } = payloadForApi;
        console.log('[register-screen] submit register payload', debugPayload);
      }

      const registerResponse = await registerUser(payloadForApi);

      if (__DEV__) {
        console.log('[register-screen] registration response received', {
          hasToken: Boolean(registerResponse?.token),
          message: registerResponse?.message,
        });
      }

      const loginResponse = await loginUser({
        username: sanitizedUsername,
        password: values.password,
      });

      if (!loginResponse?.token) {
        throw new Error('Unable to sign in after registration. Please try signing in manually.');
      }

      const resolvedRole = resolveRole(loginResponse.user);

      await saveAuthSession({
        token: loginResponse.token,
        role: resolvedRole,
        username: sanitizedUsername,
        user: loginResponse.user,
      });

      setAuthTokenHeader(loginResponse.token);

      if (__DEV__) {
        console.log('[register-screen] auto-login succeeded', {
          username: sanitizedUsername,
          role: resolvedRole,
        });
      }

      try {
        await verifySession();
      } catch (verifyError) {
        if (__DEV__) {
          console.warn('[register-screen] session verification warning', verifyError);
        }
      }

      if (isMountedRef.current) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'DevPlayground' }],
        });
      }
    } catch (error) {
      const message = mapAuthError(error, 'Unable to create account. Please check your details.');
      if (isMountedRef.current) {
        setApiError(message);
        setError('password', { message });
      }
    }
  },
  [navigation, clearErrors, resolveRole, setError],
);


  const passwordValue = watch('password');
    const selectedState = watch('state');

  const behavior = isIosPlatform() ? 'padding' : undefined;

  const stateOptions = useMemo<ReadonlyArray<SelectFieldOption>>(() => states, [states]);


  const handleNavigateToLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={behavior} keyboardVerticalOffset={24}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            accessibilityLabel="Registration screen"
          >
            <Text style={styles.title} accessibilityRole="header">
              Create Your Account
            </Text>
            <Text style={styles.subtitle}>
              Join the community and access personalized learning resources.
            </Text>

            {apiError ? (
              <View style={styles.errorBanner} accessibilityLiveRegion="polite">
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            ) : null}

            <View style={styles.row}>
              <View style={[styles.rowItem, styles.rowItemSpacing]}>
                <Text style={styles.label}>First Name</Text>
                <Controller
                  control={control}
                  name="firstName"
                  rules={{ required: 'First name is required.' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value}
                      onChangeText={(text) => {
                        resetErrors('firstName');
                        onChange(text);
                      }}
                      onBlur={onBlur}
                      placeholder="Enter first name"
                      autoCapitalize="words"
                      autoCorrect
                      error={errors.firstName?.message}
                      testID="register-first-name"
                      accessibilityLabel="First Name"
                    />
                  )}
                />
              </View>

              <View style={styles.rowItem}>
                <Text style={styles.label}>Last Name</Text>
                <Controller
                  control={control}
                  name="lastName"
                  rules={{ required: 'Last name is required.' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value}
                      onChangeText={(text) => {
                        resetErrors('lastName');
                        onChange(text);
                      }}
                      onBlur={onBlur}
                      placeholder="Enter last name"
                      autoCapitalize="words"
                      autoCorrect
                      error={errors.lastName?.message}
                      testID="register-last-name"
                      accessibilityLabel="Last Name"
                    />
                  )}
                />
              </View>
            </View>

            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email is required.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address.',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={(text) => {
                    resetErrors('email');
                    onChange(text);
                  }}
                  onBlur={onBlur}
                  placeholder="Enter email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  error={errors.email?.message}
                  testID="register-email"
                  accessibilityLabel="Email"
                />
              )}
            />

            <Text style={styles.label}>Username</Text>
            <Controller
              control={control}
              name="username"
              rules={{
                required: 'Username is required.',
                minLength: { value: 3, message: 'Username must contain at least 3 characters.' },
                validate: (val: string) => {
                  const trimmed = val.trim();
                  if (!trimmed) {
                    return 'Username is required.';
                  }
                  if (trimmed.includes(' ')) {
                    return 'Username cannot contain spaces.';
                  }
                  return true;
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={(text) => {
                    resetErrors('username');
                    onChange(text);
                  }}
                  onBlur={onBlur}
                  placeholder="Create a username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.username?.message}
                  testID="register-username"
                  accessibilityLabel="Username"
                />
              )}
            />

            <Text style={styles.label}>Phone Number</Text>
            <Controller
              control={control}
              name="phoneNumber"
              rules={{
                required: 'Phone number is required.',
                validate: (val: string) => {
                  const digits = val.replace(/\D/g, '').trim();
                  if (!digits) {
                    return 'Phone number is required.';
                  }
                  return digits.length >= 10 || 'Phone number must be at least 10 digits.';
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={(text) => {
                    resetErrors('phoneNumber');
                    onChange(text);
                  }}
                  onBlur={onBlur}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.phoneNumber?.message}
                  testID="register-phone"
                  accessibilityLabel="Phone Number"
                />
              )}
            />

            <Text style={styles.label}>City</Text>
            <Controller
              control={control}
              name="city"
              defaultValue=""
              rules={{ required: 'City is required.' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={(text) => {
                    setApiError('');
                    clearErrors('city');
                    onChange(text);
                  }}
                  onBlur={onBlur}
                  placeholder="Your city"
                  autoCapitalize="words"
                  autoCorrect
                  error={errors.city?.message}
                  testID="register-city"
                  accessibilityLabel="City"
                />
              )}
            />

            <SelectField
              label="State"
              value={selectedState}
              placeholder="Select state"
              options={stateOptions}
              onSelect={(selected) => {
                resetErrors('state');
                setValue('state', selected, { shouldValidate: true });
              }}
              error={errors.state?.message ?? stateFetchError}
              testID="register-state"
              loading={statesLoading}
            />

            {stateFetchError ? (
              <Button
                title="Reload States"
                onPress={loadStates}
                variant="outline"
                disabled={statesLoading}
                style={styles.reloadButton}
              />
            ) : null}

            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Password is required.',
                minLength: { value: 6, message: 'Password must be at least 6 characters long.' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={(text) => {
                    resetErrors('password');
                    onChange(text);
                  }}
                  onBlur={onBlur}
                  placeholder="Create a password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.password?.message}
                  testID="register-password"
                  accessibilityLabel="Password"
                />
              )}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: 'Please confirm your password.',
                validate: (value: string) => {
                  if (!value) {
                    return 'Please confirm your password.';
                  }
                  if (value !== passwordValue) {
                    return 'Passwords must match.';
                  }
                  return true;
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={(text) => {
                    resetErrors('confirmPassword');
                    onChange(text);
                  }}
                  onBlur={onBlur}
                  placeholder="Confirm password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.confirmPassword?.message}
                  testID="register-confirm-password"
                  accessibilityLabel="Confirm Password"
                />
              )}
            />

            <SubmitButton
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              loading={isSubmitting}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Button
                title="Sign In"
                onPress={handleNavigateToLogin}
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

RegisterScreen.displayName = 'RegisterScreen';

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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: Typography.smallText,
    fontWeight: Typography.medium,
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rowItem: {
    flex: 1,
  },
  rowItemSpacing: {
    marginRight: 16,
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
  selectTrigger: {
    borderWidth: 1,
    borderColor: Colors.silverGray,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectTriggerError: {
    borderColor: Colors.redOrange,
  },
  selectPlaceholderText: {
    fontSize: Typography.bodyText,
    color: Colors.secondaryDark,
  },
  selectValueText: {
    fontSize: Typography.bodyText,
    color: Colors.primaryDark,
  },
  selectIndicator: {
    fontSize: Typography.bodyText,
    color: Colors.secondaryDark,
    marginLeft: 12,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: Typography.mediumTitle,
    fontWeight: Typography.bold,
    color: Colors.primaryDark,
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.silverGray,
  },
  modalOptionText: {
    fontSize: Typography.bodyText,
    color: Colors.primaryDark,
  },
  modalEmptyText: {
    fontSize: Typography.bodyText,
    color: Colors.secondaryDark,
    paddingVertical: 12,
  },
  modalCloseButton: {
    marginTop: 16,
  },
  reloadButton: {
    marginBottom: 16,
  },
  footer: {
    marginTop: 12,
  },
  footerText: {
    fontSize: Typography.bodyText,
    color: Colors.primaryDark,
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 12,
  },
  errorText: {
    fontSize: Typography.extraSmall,
    color: Colors.redOrange,
    marginTop: 4,
  },
});

export default RegisterScreen;






