/**
 * HOME SCREEN - Navigation Hub
 * 
 * CHANGES MADE:
 * 1. Added App-Only Scanner button for specialized app QR code scanning
 * 2. Maintained existing functionality for general QR scanning
 * 3. Added clear labeling to distinguish between scanner types
 * 
 * FEATURES:
 * - General QR Scanner: Scans all types of QR codes
 * - App-Only Scanner: Scans only app-related QR codes
 * - Users List: View user data from API
 */

import React from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Users App</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="🔍 General QR Scanner" 
          onPress={() => navigation.navigate('Scanner')} 
        />
        <Text style={styles.buttonDescription}>
          Scans all types of QR codes (websites, phone, SMS, email, app links, text)
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="📱 App-Only QR Scanner" 
          onPress={() => navigation.navigate('AppOnlyScanner')} 
        />
        <Text style={styles.buttonDescription}>
          Scans only app-related QR codes (qrcodeapp:// URLs only)
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="👥 View Users" 
          onPress={() => navigation.navigate('Users')} 
        />
        <Text style={styles.buttonDescription}>
          View user list from API
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 20,
  },
});

