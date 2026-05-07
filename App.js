import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { initDB } from './src/db/init';
import { startBackgroundSync } from './src/services/syncQueueService';

export default function App() {
  useEffect(() => {
    initDB();
    startBackgroundSync(); // Запускаем фоновую синхронизацию
  }, []);

  return (
    <SafeAreaProvider>
      <UserProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </UserProvider>
    </SafeAreaProvider>
  );
}