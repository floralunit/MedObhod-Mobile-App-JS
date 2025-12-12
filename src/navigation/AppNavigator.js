import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import PatientListScreen from '../screens/PatientListScreen';
import PatientCardScreen from '../screens/PatientCardScreen';
import VitalsChartScreen from '../screens/VitalsChartScreen';
import CreateAppointmentScreen from '../screens/CreateAppointmentScreen';
import NurseRouteScreen from '../screens/NurseRouteScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user } = useUser();

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007aff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      {!user ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ 
              title: 'Главная',
              headerShown: false 
            }}
          />
          <Stack.Screen 
            name="Patients" 
            component={PatientListScreen}
            options={{ title: 'Список пациентов' }}
          />
          <Stack.Screen 
            name="PatientCard" 
            component={PatientCardScreen}
            options={({ route }) => ({ 
              title: route.params?.patient?.name || 'Карточка пациента' 
            })}
          />
          <Stack.Screen 
            name="VitalsChart" 
            component={VitalsChartScreen}
            options={{ title: 'Графики показателей' }}
          />
          <Stack.Screen 
            name="CreateAppointment" 
            component={CreateAppointmentScreen}
            options={{ title: 'Новое назначение' }}
          />
          <Stack.Screen 
            name="NurseRoute" 
            component={NurseRouteScreen}
            options={{ title: 'Обход' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}