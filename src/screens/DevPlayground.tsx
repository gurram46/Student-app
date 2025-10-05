import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../Input';
import { clearAuthSession } from '../utils/storage';
import { setAuthTokenHeader } from '../api/auth';
import type { AuthStackParamList } from '../navigation/AppNavigator';

const DevPlayground = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleButtonPress = (variant: string) => {
    console.log(`${variant} button pressed!`);
  };

  const handleSubmit = () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    console.log('Form submitted with:', { email, password });
  };

  const handleLogout = useCallback(async () => {
    try {
      if (__DEV__) {
        console.log('[auth] Logging out…');
      }
      await clearAuthSession();
      setAuthTokenHeader(null);
    } catch (error) {
      if (__DEV__) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[dev-playground] failed to clear session', { message });
      }
    } finally {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Component Playground</Text>

        {/* Input Component Demo */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Input Component Demo</Text>

          <Input
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="email-input"
          />

          <Input
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            testID="password-input"
          />

          <Input
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={error}
            testID="confirm-password-input"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title="Submit Form"
            onPress={handleSubmit}
            variant="gold-gradient"
            style={{ marginTop: 10 }}
          />
        </View>

        {/* Button Component Demo */}
        <View style={styles.buttonContainer}>
          <Text style={styles.sectionTitle}>Default Button</Text>
          <Button
            title="Default Button"
            onPress={() => handleButtonPress('Default')}
            variant="default"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Text style={styles.sectionTitle}>Outline Button</Text>
          <Button
            title="Outline Button"
            onPress={() => handleButtonPress('Outline')}
            variant="outline"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Text style={styles.sectionTitle}>Gold Gradient Button</Text>
          <Button
            title="Gold Gradient Button"
            onPress={() => handleButtonPress('Gold Gradient')}
            variant="gold-gradient"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Text style={styles.sectionTitle}>Disabled Buttons</Text>
          <Button
            title="Disabled Default"
            onPress={() => handleButtonPress('Disabled Default')}
            variant="default"
            disabled
          />
          <Button
            title="Disabled Outline"
            onPress={() => handleButtonPress('Disabled Outline')}
            variant="outline"
            disabled
            style={{ marginTop: 10 }}
          />
          <Button
            title="Disabled Gold Gradient"
            onPress={() => handleButtonPress('Disabled Gold Gradient')}
            variant="gold-gradient"
            disabled
            style={{ marginTop: 10 }}
          />
        </View>

        <View style={styles.logoutContainer}>
          <Button
            title="Logout"
            variant="outline"
            onPress={handleLogout}
            accessibilityLabel="Logout"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#0B2545',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#0B2545',
  },
  sectionContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  buttonContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#F97316',
    marginTop: 4,
    textAlign: 'center',
  },
  logoutContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
});

export default DevPlayground;
