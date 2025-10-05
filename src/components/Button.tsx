import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../styles/colors';
import { Typography } from '../styles/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'default' | 'outline' | 'gold-gradient';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'default',
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  // Handle press only if not disabled
  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  // Render button based on variant
  const renderButtonContent = () => {
    const textStyles = [
      styles.textBase,
      getVariantTextStyle(),
      disabled && styles.disabledButtonText,
      textStyle
    ];

    switch (variant) {
      case 'gold-gradient':
        return (
          <TouchableOpacity
            style={[styles.buttonBase, style, disabled && styles.disabledButton]}
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={disabled ? 1 : 0.8}
            accessibilityRole='button'
            accessibilityLabel={accessibilityLabel ?? title}
          >
            <LinearGradient
              pointerEvents='none'
              style={[StyleSheet.absoluteFillObject, styles.goldGradientBackground]}
              colors={[Colors.lightGold, Colors.warmGold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={textStyles}>{title}</Text>
          </TouchableOpacity>
        );
      case 'outline':
        return (
          <TouchableOpacity
            style={[
              styles.buttonBase,
              styles.outlineButton,
              disabled && styles.disabledButton,
              style
            ]}
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={disabled ? 1 : 0.8}
            accessibilityRole='button'
            accessibilityLabel={accessibilityLabel ?? title}
          >
            <Text style={textStyles}>{title}</Text>
          </TouchableOpacity>
        );
      case 'default':
      default:
        return (
          <TouchableOpacity
            style={[
              styles.buttonBase,
              styles.defaultButton,
              disabled && styles.disabledButton,
              style
            ]}
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={disabled ? 1 : 0.8}
            accessibilityRole='button'
            accessibilityLabel={accessibilityLabel ?? title}
          >
            <Text style={textStyles}>{title}</Text>
          </TouchableOpacity>
        );
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'default':
        return styles.defaultButtonText;
      case 'outline':
        return styles.outlineButtonText;
      case 'gold-gradient':
        return styles.goldGradientButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  return renderButtonContent();
};

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  defaultButton: {
    backgroundColor: Colors.primaryDark,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  goldGradientButton: {
    // Deprecated placeholder
  },
  goldGradientBackground: {
    borderRadius: 12,
  },
  textBase: {
    fontSize: Typography.bodyText,
    fontWeight: Typography.semiBold,
  },
  defaultButtonText: {
    color: Colors.white,
  },
  outlineButtonText: {
    color: Colors.gold,
  },
  goldGradientButtonText: {
    color: Colors.primaryDark,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.5,
  },
});

export default Button;

