import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import PatientListScreen from '../screens/PatientListScreen';
import PatientCardScreen from '../screens/PatientCardScreen';
import VitalsChartScreen from '../screens/VitalsChartScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Patients" component={PatientListScreen} />
        <Stack.Screen name="PatientCard" component={PatientCardScreen} />
        <Stack.Screen name="VitalsChart" component={VitalsChartScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
