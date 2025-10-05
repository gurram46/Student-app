import React from 'react';
import {
  View,
  ViewStyle,
  Text,
  TextStyle,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../styles/colors';
import { Typography } from '../styles/typography';

interface CardProps {
  title: string; // Required main text
  subtitle?: string; // Optional smaller text
  icon?: React.ReactNode; // Optional icon component
  onPress?: () => void; // Optional press handler
  variant?: 'default' | 'premium'; // Style variant
  style?: ViewStyle; // Custom container overrides
  titleStyle?: TextStyle; // Custom title overrides
  subtitleStyle?: TextStyle; // Custom subtitle overrides
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  variant = 'default',
  style,
  titleStyle,
  subtitleStyle,
}) => {
  // Determine styles based on variant
  const getContainerStyle = () => {
    const baseStyle = [styles.container, style];
    
    if (variant === 'premium') {
      return [baseStyle, styles.premiumContainer];
    }
    return [baseStyle, styles.defaultContainer];
  };

  // Render the card content
  const renderCardContent = () => (
    <>
      {icon && <View style={styles.icon}>{icon}</View>}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            variant === 'premium' && styles.premiumTitle,
            titleStyle,
          ]}
          accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              variant === 'premium' && styles.premiumSubtitle,
              subtitleStyle,
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </>
  );

  // If no onPress function is provided, render as a non-pressable View
  if (!onPress) {
    return (
      <View
        style={getContainerStyle()}
        accessible={true}
        accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
        accessibilityRole="text"
      >
        {renderCardContent()}
      </View>
    );
  }

  // Otherwise, render as a pressable TouchableOpacity
  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityRole="button"
    >
      {renderCardContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultContainer: {
    backgroundColor: Colors.white,
    borderColor: Colors.silverGray,
    borderWidth: 1,
  },
  premiumContainer: {
    borderColor: Colors.gold,
    borderWidth: 2,
    // For a subtle gradient effect, we could use a background color that's a mix of lightGold and warmGold
    // Since React Native doesn't support gradients in the same way as CSS, we'll use a middle value
    backgroundColor: Colors.lightBackground,
  },
  textContainer: {
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: Typography.mediumTitle,
    fontWeight: Typography.semiBold,
    color: Colors.primaryDark,
  },
  premiumTitle: {
    color: Colors.primaryDark,
  },
  subtitle: {
    fontSize: Typography.smallText,
    color: Colors.secondaryDark,
    marginTop: 4,
  },
  premiumSubtitle: {
    color: Colors.secondaryDark,
  },
});

export default Card;