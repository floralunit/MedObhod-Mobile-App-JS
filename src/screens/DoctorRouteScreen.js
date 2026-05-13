import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { globalStyles } from '../styles/globalStyles';
import {
  getRoundItemsFromLocalDB,
  completeRoundItemLocally,
  completeRoundLocally,
} from '../services/roundSyncService';
import { db } from '../db/database';

export default function DoctorRouteScreen({ route, navigation }) {
  const { user } = useUser();
  const { roundId } = route.params || {};

  const [roundItems, setRoundItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visitedMap, setVisitedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [roundStartTime, setRoundStartTime] = useState(null);

  // Обновляем время
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => setCurrentTime(new Date()), 60000);
      loadRoundItems();
      return () => clearInterval(interval);
    }, [roundId])
  );

  const loadRoundItems = () => {
    try {
      setLoading(true);

      const roundData = db.execute(
        'SELECT StartTime FROM DoctorRounds WHERE DoctorRound_ID = ?',
        [roundId]
      );
      const startTime = roundData.rows?._array?.[0]?.StartTime;
      if (startTime) {
        setRoundStartTime(new Date(startTime));
      }

      const items = getRoundItemsFromLocalDB(roundId);
      setRoundItems(items);

      const map = {};
      items.forEach(item => {
        map[item.DoctorRoundItem_ID] = item.Status === 'completed';
      });
      setVisitedMap(map);

      const firstUnvisited = items.findIndex(item => item.Status !== 'completed');
      if (firstUnvisited >= 0) {
        setCurrentIndex(firstUnvisited);
      } else {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to load round items:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentItem = roundItems[currentIndex];
  const visitedCount = Object.values(visitedMap).filter(v => v).length;
  const totalCount = roundItems.length;

  // Вычисляем статус из NEWS
  const getStatusFromNEWS = (newsScore) => {
    if (newsScore >= 7) return { text: 'КРИТИЧЕСКИЙ', color: '#dc3545' };
    if (newsScore >= 5) return { text: 'ТРЕБУЕТ ВНИМАНИЯ', color: '#ff9800' };
    return { text: 'СТАБИЛЬНЫЙ', color: '#28a745' };
  };

  const handleMarkVisited = () => {
    if (!currentItem) return;

    Alert.alert(
      'Завершить осмотр',
      `Отметить "${currentItem.patientName}" как осмотренного?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Да',
          onPress: async () => {
            setSaving(true);
            try {
              completeRoundItemLocally(currentItem.DoctorRoundItem_ID);

              const newMap = { ...visitedMap, [currentItem.DoctorRoundItem_ID]: true };
              setVisitedMap(newMap);

              const newVisitedCount = Object.values(newMap).filter(v => v).length;

              if (newVisitedCount >= totalCount) {
                completeRoundLocally(roundId);
                Alert.alert('Обход завершён!', 'Все пациенты осмотрены', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                // Ищем следующего неосмотренного
                let nextIndex = currentIndex + 1;
                while (nextIndex < totalCount && newMap[roundItems[nextIndex].DoctorRoundItem_ID]) {
                  nextIndex++;
                }
                if (nextIndex < totalCount) {
                  setCurrentIndex(nextIndex);
                } else {
                  nextIndex = 0;
                  while (nextIndex < totalCount && newMap[roundItems[nextIndex].DoctorRoundItem_ID]) {
                    nextIndex++;
                  }
                  if (nextIndex < totalCount) setCurrentIndex(nextIndex);
                }
              }
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex < totalCount - 1) setCurrentIndex(prev => prev + 1);
  };

  const handleEndRound = () => {
    const criticalUnvisited = roundItems.filter(
      item => !visitedMap[item.DoctorRoundItem_ID] && item.newsScore >= 7
    );

    const message = criticalUnvisited.length > 0
      ? `Осталось ${criticalUnvisited.length} критических пациентов. Завершить обход?`
      : 'Завершить обход?';

    Alert.alert('Завершить обход', message, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Завершить',
        style: 'destructive',
        onPress: () => {
          completeRoundLocally(roundId);
          navigation.goBack();
        }
      }
    ]);
  };

  // Переход в карточку пациента с полными данными
  const handleViewPatientCard = () => {
    if (!currentItem) return;

    navigation.navigate('PatientCard', {
      patient: {
        id: currentItem.Hospitalization_ID,
        name: currentItem.patientName,
        age: currentItem.age,
        room: currentItem.room,
        diagnosis: currentItem.diagnosis,
        newsScore: currentItem.newsScore,
        hospitalizationId: currentItem.Hospitalization_ID,
      }
    });
  };

  // Создание назначения
  const handleCreateAppointment = () => {
    if (!currentItem) return;

    navigation.navigate('CreateAppointment', {
      patientId: currentItem.Hospitalization_ID,
      patientName: currentItem.patientName,
      hospitalizationId: currentItem.Hospitalization_ID,
    });
  };

  // Добавление заметки
  const handleAddNote = () => {
    if (!currentItem) return;

    navigation.navigate('DoctorNoteForm', {
      patient: {
        id: currentItem.Hospitalization_ID,
        name: currentItem.patientName,
        room: currentItem.room,
        hospitalizationId: currentItem.Hospitalization_ID,
      },
      onSave: async (note) => {
        try {
          const { addDoctorNote } = require('../services/doctorNoteSyncService');
          await addDoctorNote(currentItem.Hospitalization_ID, user?.id, note);
          Alert.alert('Успешно', 'Заметка добавлена');
        } catch (error) {
          console.error('Failed to add note:', error);
          Alert.alert('Ошибка', 'Не удалось добавить заметку');
        }
      }
    });
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

  if (saving) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={{ marginTop: 16 }}>Сохранение...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentItem) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666' }}>Нет данных обхода</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16, padding: 12, backgroundColor: '#007aff', borderRadius: 8 }}
          >
            <Text style={{ color: '#fff' }}>Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getStatusFromNEWS(currentItem.newsScore || 0);
  const progressPercent = totalCount > 0 ? (visitedCount / totalCount) * 100 : 0;

  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: '#f8f9fa' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Шапка с временем начала обхода */}
      <View style={{
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e8e8e8',
      }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>Врачебный обход</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Text style={{ fontSize: 13, color: '#666' }}>
            🕐 Начат: {roundStartTime ? roundStartTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </Text>
          <Text style={{ fontSize: 13, color: '#666', marginLeft: 16 }}>
            📋 Пациентов: {totalCount}
          </Text>
        </View>
      </View>

      {/* Прогресс-бар и кнопка завершить */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 7, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>
            Осмотрено: {visitedCount} из {totalCount}
          </Text>
          <TouchableOpacity
            onPress={handleEndRound}
            style={{
              backgroundColor: '#dc3545',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Завершить обход</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
          <View style={{
            height: '100%',
            backgroundColor: '#28a745',
            borderRadius: 4,
            width: `${progressPercent}%`
          }} />
        </View>
      </View>

      {/* Навигация */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 7,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e8e8e8',
      }}>
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentIndex === 0}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: currentIndex === 0 ? '#e9ecef' : '#007aff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: currentIndex === 0 ? '#999' : '#fff', fontSize: 22, fontWeight: 'bold' }}>←</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
            {currentIndex + 1} / {totalCount}
          </Text>
          <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>пациент</Text>
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={currentIndex >= totalCount - 1}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: currentIndex >= totalCount - 1 ? '#e9ecef' : '#007aff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: currentIndex >= totalCount - 1 ? '#999' : '#fff', fontSize: 22, fontWeight: 'bold' }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Карточка пациента */}
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Имя и бейдж осмотрен */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', flex: 1 }}>
                {currentItem.patientName || 'Пациент'}
              </Text>
              {visitedMap[currentItem.DoctorRoundItem_ID] && (
                <View style={{
                  backgroundColor: '#d4edda',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#155724', fontSize: 13, fontWeight: '600' }}>✓ Осмотрен</Text>
                </View>
              )}
            </View>

            {/* Палата, возраст, NEWS и статус */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                <View style={{
                  backgroundColor: '#f0f4ff',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8
                }}>
                  <Text style={{ fontSize: 12, color: '#333' }}>
                    🏠 Палата {currentItem.room || '?'}
                  </Text>
                </View>

                {currentItem.age && (
                  <View style={{
                    backgroundColor: '#f0f4ff',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8
                  }}>
                    <Text style={{ fontSize: 12, color: '#333' }}>
                      👤 {currentItem.age} лет
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  backgroundColor: status.color,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                    NEWS: {currentItem.newsScore || 0}
                  </Text>
                </View>

                <View style={{
                  backgroundColor: `${status.color}15`,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: `${status.color}30`,
                }}>
                  <Text style={{ color: status.color, fontWeight: '600', fontSize: 12 }}>
                    {status.text}
                  </Text>
                </View>
              </View>
            </View>

            {/* Диагноз */}
            <View style={{
              backgroundColor: '#f8f9fa',
              padding: 16,
              borderRadius: 12,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: '#007aff',
            }}>
              <Text style={{ fontSize: 12, color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Диагноз
              </Text>
              <Text style={{ fontSize: 16, color: '#1a1a1a', lineHeight: 20 }}>
                {currentItem.diagnosis || 'Не указан'}
              </Text>
            </View>

            {/* Кнопки действий */}
            <TouchableOpacity
              style={{
                backgroundColor: '#007aff',
                padding: 12,
                borderRadius: 14,
                alignItems: 'center',
                marginBottom: 12,
              }}
              onPress={handleViewPatientCard}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>📋 Карточка пациента</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#ffc107',
                  padding: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
                onPress={handleAddNote}
              >
                <Text style={{ color: '#333', fontWeight: '700', fontSize: 13 }}>📝 Заметка</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#ff9800',
                  padding: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
                onPress={handleCreateAppointment}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>💊 Назначить</Text>
              </TouchableOpacity>
            </View>

            {/* Отметить осмотренным */}
            <TouchableOpacity
              style={{
                backgroundColor: visitedMap[currentItem.DoctorRoundItem_ID] ? '#a0a0a0' : '#28a745',
                padding: 13,
                borderRadius: 14,
                alignItems: 'center',
              }}
              onPress={handleMarkVisited}
              disabled={visitedMap[currentItem.DoctorRoundItem_ID]}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                {visitedMap[currentItem.DoctorRoundItem_ID] ? '✓ Уже осмотрен' : '✓ Отметить осмотренным'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}