import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { Colors } from './styles/colors';
import { Typography } from './styles/typography';

interface InputProps extends Omit<TextInputProps, 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
}

const Input: React.FC<InputProps> = React.memo(({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType,
  error,
  style,
  inputStyle,
  testID,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Input validation
  let safeValue = value;
  if (typeof safeValue !== 'string') {
    if (__DEV__) {
      throw new Error('Input value must be a string');
    }
    safeValue = safeValue == null ? '' : String(safeValue);
  }

  // Sanitize placeholder and error strings
  const sanitizedPlaceholder = placeholder ? sanitizeString(placeholder) : '';
  const sanitizedError = error ? sanitizeString(error) : '';

  const handleChangeText = (text: string) => {
    onChangeText(text);
  };

  // Function to sanitize strings by removing control characters
  function sanitizeString(str: string): string {
    // Remove control characters (ASCII 0-31) and normalize whitespace
    return str.replace(/[\x00-\x1F\x7F]/g, '').trim();
  }

  const accessibilityLabel = sanitizedPlaceholder || testID || 'input field';

  // Determine textContentType for better security and user experience
  let textContentType: 'none' | 'URL' | 'addressCity' | 'addressCityAndState' | 'addressState' | 'countryName' | 'creditCardNumber' | 'emailAddress' | 'familyName' | 'fullStreetAddress' | 'givenName' | 'jobTitle' | 'location' | 'middleName' | 'name' | 'namePrefix' | 'nameSuffix' | 'nickname' | 'organizationName' | 'postalCode' | 'streetAddressLine1' | 'streetAddressLine2' | 'sublocality' | 'telephoneNumber' | 'username' | 'password' | 'newPassword' | 'oneTimeCode' = 'none';
  
  if (placeholder?.toLowerCase().includes('email') || restProps.textContentType === 'emailAddress') {
    textContentType = 'emailAddress';
  } else if (secureTextEntry && placeholder?.toLowerCase().includes('password')) {
    textContentType = 'password';
  } else if (secureTextEntry) {
    textContentType = 'newPassword';
  }

  // Configure autoCapitalize and autoCorrect for security
  const autoCapitalize = secureTextEntry ? 'none' : (restProps.autoCapitalize || 'sentences');
  const autoCorrect = secureTextEntry ? false : (restProps.autoCorrect || true);

  return (
    <View style={[styles.container, style]} testID={testID}>
      <TextInput
        value={safeValue}
        onChangeText={handleChangeText}
        placeholder={sanitizedPlaceholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          inputStyle,
          { borderColor: isFocused ? Colors.gold : Colors.silverGray }
        ]}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        textContentType={textContentType}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="text"
        accessibilityState={isFocused ? { selected: true } : undefined}
        {...restProps}
      />
      {sanitizedError ? (
        <Text style={styles.errorText} accessibilityLabel={`Error: ${sanitizedError}`}>
          {sanitizedError}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.silverGray,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: Typography.bodyText,
    color: Colors.primaryDark,
    borderRadius: 4, // Adding border radius for better appearance
  },
  errorText: {
    fontSize: Typography.extraSmall,
    color: Colors.redOrange,
    marginTop: 4,
  },
});

export default Input;
