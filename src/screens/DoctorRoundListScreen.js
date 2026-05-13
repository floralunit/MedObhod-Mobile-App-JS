import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { globalStyles } from '../styles/globalStyles';
import { getLocalPatients } from '../services/patientSyncService';
import { getLatestNEWS } from '../services/vitalSignsSyncService';
import {
  getActiveRoundFromLocalDB,
  cleanupStaleRoundsLocally,
  createRoundLocally,
  completeRoundLocally,
} from '../services/roundSyncService';
import { SafeScreen } from '../components/SafeScreen';

export default function DoctorRoundListScreen({ navigation }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [activeRound, setActiveRound] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Очищаем устаревшие обходы
      cleanupStaleRoundsLocally(user?.id);

      // 2. Проверяем активный обход
      const active = getActiveRoundFromLocalDB(user?.id);
      setActiveRound(active);

      // 3. Загружаем пациентов из локальной БД (единый источник)
      const allPatients = await getLocalPatients();
      const myPatients = allPatients.filter(p => p.doctorId === user?.id && p.hospitalizationId);

      // вычисляем статус пациентов
      const enrichedPatients = myPatients.map(p => {
        const newsData = getLatestNEWS(p.hospitalizationId);
        return {
          ...p,
          newsScore: newsData.newsScore || 0,
          status: newsData.status || 'stable'
        };
      });

      // Сортировка по приоритету
      const sorted = enrichedPatients.sort((a, b) => {
        const aNews = a.newsScore || 0;
        const bNews = b.newsScore || 0;

        if (aNews >= 7 && bNews < 7) return -1;
        if (bNews >= 7 && aNews < 7) return 1;
        if (aNews >= 5 && bNews < 5) return -1;
        if (bNews >= 5 && aNews < 5) return 1;

        return (parseInt(a.room) || 0) - (parseInt(b.room) || 0);
      });

      setPatients(sorted);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleStartRound = () => {
    if (patients.length === 0) {
      Alert.alert('Нет пациентов', 'У вас нет назначенных пациентов');
      return;
    }

    if (activeRound) {
      Alert.alert(
        'Активный обход',
        'Завершить текущий и начать новый?',
        [
          {
            text: 'Завершить и начать новый',
            style: 'destructive',
            onPress: () => {
              completeRoundLocally(activeRound.id);
              const round = createRoundLocally(user?.id, patients);
              navigation.navigate('DoctorRoute', { roundId: round.id });
            },
          },
          {
            text: 'Продолжить',
            onPress: () => navigation.navigate('DoctorRoute', { roundId: activeRound.id }),
          },
          { text: 'Отмена', style: 'cancel' },
        ]
      );
      return;
    }

    const round = createRoundLocally(user?.id, patients);
    navigation.navigate('DoctorRoute', { roundId: round.id });
  };

  const getStatusColor = (newsScore) => {
    if (newsScore >= 7) return '#dc3545';
    if (newsScore >= 5) return '#ff9800';
    return '#28a745';
  };

  const getStatusText = (newsScore) => {
    if (newsScore >= 7) return 'КРИТИЧЕСКИЙ';
    if (newsScore >= 5) return 'ТРЕБУЕТ ВНИМАНИЯ';
    return 'СТАБИЛЬНЫЙ';
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007aff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeScreen backgroundColor="#fff" barStyle="dark-content">
      <ScrollView style={{ padding: 16 }}>
        {/* Активный обход */}
        {activeRound && (
          <View style={styles.activeRoundCard}>
            <Text style={styles.activeRoundTitle}>🔄 Активный обход</Text>
            <Text style={styles.activeRoundText}>
              Начат: {new Date(activeRound.startTime).toLocaleString()}
            </Text>
            <Text style={styles.activeRoundText}>
              Пациентов: {activeRound.items?.length || 0}
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => navigation.navigate('DoctorRoute', { roundId: activeRound.id })}
            >
              <Text style={styles.continueButtonText}>Продолжить обход →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Кнопка начать обход */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartRound}>
          <Text style={styles.startButtonText}>
            {activeRound ? '🔄 Начать новый обход' : '🚶‍♂️ Начать обход'}
          </Text>
        </TouchableOpacity>

        {/* Список пациентов */}
        <Text style={styles.sectionTitle}>Пациенты ({patients.length})</Text>

        {patients.map((patient) => (
          <TouchableOpacity
            key={patient.id}
            style={styles.patientCard}
            onPress={() => navigation.navigate('PatientCard', { patient })}
          >
            <View style={styles.patientHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientRoom}>Палата {patient.room}</Text>
              </View>
              <View style={[styles.newsBadge, { backgroundColor: getStatusColor(patient.newsScore) }]}>
                <Text style={styles.newsText}>NEWS: {patient.newsScore}</Text>
              </View>
            </View>
            <Text style={styles.diagnosis}>{patient.diagnosis}</Text>
            <Text style={[styles.statusText, { color: getStatusColor(patient.newsScore) }]}>
              {getStatusText(patient.newsScore)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  activeRoundCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007aff',
  },
  activeRoundTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007aff',
    marginBottom: 8,
  },
  activeRoundText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  continueButton: {
    backgroundColor: '#007aff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 1,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  patientRoom: {
    fontSize: 13,
    color: '#666',
  },
  newsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  diagnosis: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});