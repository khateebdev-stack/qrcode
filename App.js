/**
 * MAIN APP COMPONENT - Navigation Setup
 * 
 * CHANGES MADE:
 * 1. Fixed duplicate import issue (ScannerScreen was imported as UserDetailScreen)
 * 2. Added ScannerScreen to navigation stack
 * 3. Integrated deep linking configuration for automatic navigation
 * 
 * PROBLEMS SOLVED:
 * - Duplicate import causing navigation errors
 * - Missing Scanner screen in navigation stack
 * - Deep linking not working properly
 * 
 * DEPENDENCIES USED:
 * - @react-navigation/native: For navigation container
 * - @react-navigation/native-stack: For stack navigation
 * - Custom linking config: For deep link handling
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import UsersScreen from './src/screens/UsersScreen';
import UserDetailScreen from './src/screens/UserDetailScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import AppOnlyScannerScreen from './src/screens/AppOnlyScannerScreen';
import linking from './src/utils/linkingConfig';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Users" component={UsersScreen} />
        <Stack.Screen name="UserDetail" component={UserDetailScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="AppOnlyScanner" component={AppOnlyScannerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
