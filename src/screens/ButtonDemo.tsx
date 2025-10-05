
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Button from '../components/Button';

const ButtonDemo = () => {
  const handleButtonPress = (variant: string) => {
    console.log(`${variant} button pressed!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Button Component Demo</Text>
      
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
          disabled={true}
        />
        <Button
          title="Disabled Outline"
          onPress={() => handleButtonPress('Disabled Outline')}
          variant="outline"
          disabled={true}
          style={{ marginTop: 10 }}
        />
        <Button
          title="Disabled Gold Gradient"
          onPress={() => handleButtonPress('Disabled Gold Gradient')}
          variant="gold-gradient"
          disabled={true}
          style={{ marginTop: 10 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
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
  buttonContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
});

export default ButtonDemo;