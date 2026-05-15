import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { globalStyles } from '../styles/globalStyles';
import { nurseRouteStyles } from '../styles/nurseRouteStyles';
import { getNurseExecutions, completeExecution, syncAllAppointments } from '../services/appointmentSyncService';
import { SafeScreen } from '../components/SafeScreen';

export default function NurseRouteScreen({ navigation, route }) {
  const { user } = useUser();
  const [executions, setExecutions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    all: 0,
    medication: 0,
    procedures: 0
  });

  // Загрузка при фокусе
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  // Обновляем время каждую минуту
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
        // Пересчитываем данные каждый час
        const now = new Date();
        if (now.getMinutes() === 0) {
          loadAllData();
        }
      }, 60000);
      return () => clearInterval(interval);
    }, [])
  );

  // // Применяем фильтр из параметров
  // useFocusEffect(
  //   useCallback(() => {
  //     if (route.params?.initialFilter) {
  //       setSelectedFilter(route.params.initialFilter);
  //       setExecutions(getNurseExecutions({ [route.params.initialFilter]: true }));
  //     }
  //   }, [route.params?.initialFilter])
  // );

  const loadAllData = async () => {
    try {
      await syncAllAppointments();
    } catch (e) {
      console.log('Sync skipped');
    }

    const allExecs = getNurseExecutions({ today: true });
    const medExecs = getNurseExecutions({ today: true, medication: true });
    const procExecs = getNurseExecutions({ today: true, procedures: true });

    setStats({
      all: allExecs.length,
      medication: medExecs.length,
      procedures: procExecs.length
    });

    // Показываем по текущему фильтру
    if (selectedFilter === 'all') {
      setExecutions(allExecs);
    } else {
      setExecutions(getNurseExecutions({ today: true, [selectedFilter]: true }));
    }
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    // ВСЕГДА передаем today: true для всех фильтров
    if (filter === 'all') {
      setExecutions(getNurseExecutions({ today: true })); // БЕЗ all: true
    } else {
      setExecutions(getNurseExecutions({ today: true, [filter]: true }));
    }
  };

  const handleComplete = (executionId) => {
    Alert.alert(
      'Подтверждение',
      'Отметить как выполненное?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выполнено',
          onPress: () => {
            completeExecution(executionId, user?.id);
            loadAllData();
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ff9800';
      case 'low': return '#28a745';
      default: return '#007aff';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'ВЫСОКИЙ';
      case 'medium': return 'СРЕДНИЙ';
      case 'low': return 'НИЗКИЙ';
      default: return priority?.toUpperCase() || 'НОРМА';
    }
  };

  const getAppointmentTypeIcon = (type) => {
    switch (type) {
      case 'medication': return '💊';
      case 'injection': return '💉';
      case 'iv_drip': return '💧';
      case 'procedure': return '🩺';
      case 'dressing': return '🩹';
      case 'observation': return '🌡️';
      case 'examination': return '🔍';
      default: return '📋';
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    try {
      return new Date(isoString).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  const getTimeDiff = (isoString) => {
    if (!isoString) return '';
    try {
      const dueTime = new Date(isoString);
      const now = new Date();
      const diffMs = dueTime - now;
      const diffMins = Math.round(diffMs / (1000 * 60));

      if (diffMins < -60) return `${Math.abs(Math.floor(diffMins / 60))} ч назад`;
      if (diffMins < 0) return `${Math.abs(diffMins)} мин назад`;
      if (diffMins === 0) return 'сейчас';
      if (diffMins < 60) return `через ${diffMins} мин`;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `через ${hours} ч ${mins > 0 ? mins + ' мин' : ''}`;
    } catch {
      return '';
    }
  };

  const isDueNow = (isoString) => {
    if (!isoString) return false;
    try {
      const diff = Math.abs(new Date(isoString) - new Date());
      return diff < 900000; // 15 минут
    } catch {
      return false;
    }
  };

  const getFilterLabel = (filterId) => {
    switch (filterId) {
      case 'all': return 'Все';
      case 'medication': return 'Лекарства';
      case 'procedures': return 'Процедуры';
      default: return 'Все';
    }
  };

  const getFilterCount = (filterId) => {
    switch (filterId) {
      case 'all': return stats.all || stats.today || 0;
      case 'medication': return stats.medication;
      case 'procedures': return stats.procedures;
      default: return 0;
    }
  };

  const currentTimeString = currentTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const renderExecutionItem = ({ item }) => {
    const isDue = isDueNow(item.scheduledTime);

    return (
      <TouchableOpacity
        style={[
          nurseRouteStyles.appointmentCard,
          {
            borderLeftWidth: 4,
            borderLeftColor: getPriorityColor(item.priority),
            backgroundColor: isDue ? '#fff5f5' : '#fff'
          }
        ]}
        activeOpacity={0.7}
      >
        {/* Верхняя строка: пациент и время */}
        <View style={nurseRouteStyles.appointmentHeader}>
          <View style={{ flex: 1 }}>
            <Text style={nurseRouteStyles.patientName} numberOfLines={1}>
              {item.patientName}
            </Text>
            <Text style={nurseRouteStyles.roomText}>
              Палата: {item.room}
            </Text>
          </View>

          <View style={[
            nurseRouteStyles.timeBadge,
            isDue && { backgroundColor: '#dc3545' }
          ]}>
            <Text style={[
              nurseRouteStyles.timeText,
              isDue && { color: '#fff' }
            ]}>
              {formatTime(item.scheduledTime)}
            </Text>
            <Text style={[
              nurseRouteStyles.timeDiff,
              isDue && { color: '#fff' }
            ]}>
              {getTimeDiff(item.scheduledTime)}
            </Text>
          </View>
        </View>

        {/* Тело: название и детали */}
        <View style={nurseRouteStyles.appointmentBody}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>
              {getAppointmentTypeIcon(item.type)}
            </Text>
            <Text style={nurseRouteStyles.appointmentTitle} numberOfLines={2}>
              {item.appointmentName}
            </Text>
          </View>

          {item.medicationName && (
            <View style={nurseRouteStyles.medicationInfo}>
              <Text style={nurseRouteStyles.detailText}>
                💊 Препарат: {item.medicationName} {item.medicationDosage || ''}
              </Text>
              {item.medicationForm && (
                <Text style={nurseRouteStyles.detailText}>
                  📦 Форма: {item.medicationForm}
                </Text>
              )}
            </View>
          )}

          {item.relationToMeal && item.relationToMeal !== 'В любое время' && (
            <Text style={[nurseRouteStyles.detailText, { marginTop: 4 }]}>
              🍽️ Приём: {item.relationToMeal}
            </Text>
          )}

          {item.instructions && (
            <View style={{ marginTop: 8, padding: 8, backgroundColor: '#fffbe6', borderRadius: 6 }}>
              <Text style={[nurseRouteStyles.detailText, { fontStyle: 'italic' }]}>
                📋 {item.instructions}
              </Text>
            </View>
          )}

          {item.appointmentNotes && (
            <Text style={[nurseRouteStyles.detailText, { marginTop: 4, color: '#666', fontSize: 12 }]}>
              📝 {item.appointmentNotes}
            </Text>
          )}
        </View>

        {/* Нижняя строка: приоритет и кнопка */}
        <View style={nurseRouteStyles.appointmentFooter}>
          <View style={[
            nurseRouteStyles.priorityBadge,
            { backgroundColor: getPriorityColor(item.priority) + '20' }
          ]}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: getPriorityColor(item.priority),
              marginRight: 6
            }} />
            <Text style={[nurseRouteStyles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {getPriorityText(item.priority)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              nurseRouteStyles.completeButton,
              isDue && { backgroundColor: '#dc3545' }
            ]}
            onPress={() => handleComplete(item.id)}
          >
            <Text style={nurseRouteStyles.completeButtonText}>
              {isDue ? '⚡ СРОЧНО' : '✓ Выполнить'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const filters = [
    { id: 'all', label: 'Все' },
    { id: 'medication', label: 'Лекарства' },
    { id: 'procedures', label: 'Процедуры' },
  ];

  return (
    <SafeScreen backgroundColor="#fff" barStyle="dark-content">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Заголовок */}
      <View style={nurseRouteStyles.header}>
        <View>
          <Text style={globalStyles.title}>Обход медсестры</Text>
          <Text style={nurseRouteStyles.subtitle}>
            {currentTimeString} • {executions.length} назначений
          </Text>
        </View>

        <TouchableOpacity
          style={nurseRouteStyles.refreshButton}
          onPress={loadAllData}
        >
          <Text style={nurseRouteStyles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Фильтры */}
      <View style={nurseRouteStyles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={nurseRouteStyles.filtersScrollContent}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                nurseRouteStyles.filterChip,
                selectedFilter === filter.id && nurseRouteStyles.filterChipActive
              ]}
              onPress={() => handleFilterChange(filter.id)}
            >
              <Text style={[
                nurseRouteStyles.filterChipText,
                selectedFilter === filter.id && nurseRouteStyles.filterChipTextActive
              ]}>
                {filter.label}
              </Text>
              <View style={[
                nurseRouteStyles.filterChipBadge,
                getFilterCount(filter.id) === 0 && { backgroundColor: '#ccc' }
              ]}>
                <Text style={nurseRouteStyles.filterChipBadgeText}>
                  {getFilterCount(filter.id)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Список */}
      <View style={{ flex: 1 }}>
        {executions.length > 0 ? (
          <FlatList
            data={executions}
            renderItem={renderExecutionItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          />
        ) : (
          <View style={nurseRouteStyles.emptyState}>
            <Text style={nurseRouteStyles.emptyIcon}>🎉</Text>
            <Text style={nurseRouteStyles.emptyText}>
              {selectedFilter === 'medication' ? 'Нет лекарств для выдачи' :
                selectedFilter === 'procedures' ? 'Нет процедур для выполнениыя' :
                  'Нет назначений на сегодня'}
            </Text>
            <Text style={nurseRouteStyles.emptySubtext}>
              {selectedFilter === 'upcoming' ? 'Все назначения выполнены' :
                'Проверьте другие фильтры'}
            </Text>
          </View>
        )}
      </View>
    </SafeScreen>
  );
}