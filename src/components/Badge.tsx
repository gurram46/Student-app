import React from 'react';
import { View, Text, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { Colors } from '../styles/colors';
import { Typography } from '../styles/typography';

type BadgeVariant = 'success' | 'warning' | 'error' | 'premium';

interface BadgeProps {
  label: string;          // Required text
  variant: BadgeVariant;  // Required variant
  style?: ViewStyle;      // Optional container overrides
  textStyle?: TextStyle;  // Optional text overrides
}

const Badge: React.FC<BadgeProps> = ({ label, variant, style, textStyle }) => {
  // Validate label as non-empty string (only in development)
  if (__DEV__ && (!label || typeof label !== 'string' || label.trim().length === 0)) {
    throw new Error('Badge label must be a non-empty string');
  }

  // Validate variant type (only in development)
  const validVariants: BadgeVariant[] = ['success', 'warning', 'error', 'premium'];
  if (__DEV__ && !validVariants.includes(variant)) {
    console.warn(`Invalid badge variant: ${variant}. Falling back to 'error' variant.`);
    // In development mode, we'll still throw an error for invalid variants
    throw new Error(`Invalid badge variant: ${variant}. Valid options are: ${validVariants.join(', ')}`);
  }

  // Map variant to color
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return Colors.green + '26'; // 0.15 opacity in hex (26 = ~15% opacity)
      case 'warning':
        return Colors.yellow + '26';
      case 'error':
        return Colors.redOrange + '26';
      case 'premium':
        return Colors.gold + '26';
      default:
        // This should not happen due to strict typing, but we'll handle it for safety
        return Colors.redOrange + '26';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return Colors.green;
      case 'warning':
        return Colors.yellow;
      case 'error':
        return Colors.redOrange;
      case 'premium':
        return Colors.gold;
      default:
        // This should not happen due to strict typing, but we'll handle it for safety
        return Colors.redOrange;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
      accessible={true}
      accessibilityLabel={`${variant} badge: ${label}`}
      accessibilityRole="text"
    >
      <Text
        style={[
          styles.text,
          { color: getTextColor() },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Typography.extraSmall,
    fontWeight: Typography.semiBold,
  },
});

// Export as default functional component with memoization
export default React.memo(Badge);