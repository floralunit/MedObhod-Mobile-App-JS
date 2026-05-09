import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { initDB, migrateDatabase } from './src/db/init';
import { startBackgroundSync } from './src/services/syncQueueService';
import { syncDictionary } from './src/services/dictionaryService';
import { startServerMonitoring } from './src/services/serverMonitorService';

// Кастомная конфигурация Toast
const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: '#28a745', 
        backgroundColor: '#f0fff4',
        height: 70,
        width: '90%',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#155724',
      }}
      text2Style={{
        fontSize: 13,
        color: '#28a745',
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ 
        borderLeftColor: '#dc3545', 
        backgroundColor: '#fff5f5',
        height: 70,
        width: '90%',
      }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#721c24',
      }}
      text2Style={{
        fontSize: 13,
        color: '#dc3545',
      }}
    />
  ),
};

export default function App() {
  useEffect(() => {
    const initialize = async () => {
      console.log('Initializing app...');
      await initDB();
      //await migrateDatabase();
      await syncDictionary();
      startServerMonitoring();
      startBackgroundSync();
      console.log('App initialized');
    };
    
    initialize();
  }, []);

  return (
    <SafeAreaProvider>
      <UserProvider>
        <NavigationContainer>
          <AppNavigator />
          <Toast config={toastConfig} position="top" topOffset={50} />
        </NavigationContainer>
      </UserProvider>
    </SafeAreaProvider>
  );
}