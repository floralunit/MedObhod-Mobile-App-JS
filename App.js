import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { initDB } from './src/db/init';
import { startBackgroundSync } from './src/services/syncQueueService';
import { syncDictionary } from './src/services/dictionaryService';

export default function App() {
  // Очистка зависших записей в очереди
const cleanupSyncQueue = () => {
  try {
    const { db } = require('./src/db/database');
    // Удаляем старые записи (старше 7 дней)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    db.execute(`DELETE FROM sync_queue WHERE created_at < ? AND synced = 0`, [sevenDaysAgo.toISOString()]);
    console.log('Cleaned up old sync queue entries');
  } catch (error) {
    console.error('Failed to cleanup sync queue:', error);
  }
};

  useEffect(() => {
    const initialize = async () => {
      await initDB();
      cleanupSyncQueue();
      //await migrateDatabase();
      await syncDictionary(); // Синхронизация справочников
      startBackgroundSync();
    };
    
    initialize();
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