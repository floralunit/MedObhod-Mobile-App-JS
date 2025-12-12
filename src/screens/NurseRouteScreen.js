import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  allAppointments,
  completeAppointment,
  getTodaysAppointments, // Добавьте этот импорт
  getUpcomingAppointmentsForNurse // Добавьте этот импорт
} from '../data/appointments';
import { patients } from '../data/patients';
import { globalStyles } from '../styles/globalStyles';
import { nurseRouteStyles } from '../styles/nurseRouteStyles';

const { width } = Dimensions.get('window');

export default function NurseRouteScreen({ navigation, route }) {
  const [appointments, setAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('today'); // По умолчанию "Сегодня"
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    today: 0,
    urgent: 0,
    upcoming: 0,
    medication: 0,
    procedures: 0
  });

  // Получаем начальный фильтр из параметров навигации
  useEffect(() => {
    if (route.params?.initialFilter) {
      setSelectedFilter(route.params.initialFilter);
    }
  }, [route.params]);

  // Обновляем время каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Каждую минуту
    
    return () => clearInterval(interval);
  }, []);

  // Обновляем список назначений и статистику
  useEffect(() => {
    const updateData = () => {
      // Получаем ВСЕ pending назначения
      const pendingApps = allAppointments.filter(a => a.status === 'pending');
      setAppointments(pendingApps);
      
      // Рассчитываем статистику
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      const todays = pendingApps.filter(apt => {
        if (!apt.nextDue) return true;
        const dueDate = apt.nextDue.split('T')[0];
        return dueDate === todayStr;
      });
      
      const urgent = pendingApps.filter(apt => apt.priority === 'high');
      
      const upcoming = pendingApps.filter(apt => {
        if (!apt.nextDue) return false;
        const dueTime = new Date(apt.nextDue);
        const timeDiff = (dueTime - now) / (1000 * 60 * 60); // Разница в часах
        return timeDiff <= 4 && timeDiff >= 0; // В ближайшие 4 часа
      });
      
      const medications = pendingApps.filter(apt => 
        apt.type === 'medication' || apt.type === 'injection'
      );
      
      const procedures = pendingApps.filter(apt => 
        apt.type === 'procedure' || 
        apt.type === 'dressing' || 
        apt.type === 'iv_drip' ||
        apt.type === 'observation'
      );
      
      setStats({
        today: todays.length,
        urgent: urgent.length,
        upcoming: upcoming.length,
        medication: medications.length,
        procedures: procedures.length
      });
    };
    
    updateData();
  }, [currentTime]);

  // Функция для получения реальных данных по фильтрам
  const getFilteredAppointments = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    switch (selectedFilter) {
      case 'upcoming':
        return appointments.filter(apt => {
          if (!apt.nextDue) return false;
          const dueTime = new Date(apt.nextDue);
          const timeDiff = (dueTime - now) / (1000 * 60 * 60); // Разница в часах
          return timeDiff <= 4 && timeDiff >= 0; // В ближайшие 4 часа
        }).sort((a, b) => {
          if (!a.nextDue && b.nextDue) return 1;
          if (a.nextDue && !b.nextDue) return -1;
          return new Date(a.nextDue || 0) - new Date(b.nextDue || 0);
        });
        
      case 'urgent':
        return appointments
          .filter(apt => apt.priority === 'high')
          .sort((a, b) => {
            if (!a.nextDue && b.nextDue) return 1;
            if (a.nextDue && !b.nextDue) return -1;
            return new Date(a.nextDue || 0) - new Date(b.nextDue || 0);
          });
          
      case 'today':
        return appointments.filter(apt => {
          if (!apt.nextDue) return true;
          const dueDate = apt.nextDue.split('T')[0];
          return dueDate === todayStr;
        }).sort((a, b) => {
          if (!a.nextDue && b.nextDue) return 1;
          if (a.nextDue && !b.nextDue) return -1;
          return new Date(a.nextDue || 0) - new Date(b.nextDue || 0);
        });
        
      case 'medication':
        return appointments
          .filter(apt => apt.type === 'medication' || apt.type === 'injection')
          .sort((a, b) => {
            if (!a.nextDue && b.nextDue) return 1;
            if (a.nextDue && !b.nextDue) return -1;
            return new Date(a.nextDue || 0) - new Date(b.nextDue || 0);
          });
          
      case 'procedures':
        return appointments
          .filter(apt => 
            apt.type === 'procedure' || 
            apt.type === 'dressing' || 
            apt.type === 'iv_drip' ||
            apt.type === 'observation'
          )
          .sort((a, b) => {
            if (!a.nextDue && b.nextDue) return 1;
            if (a.nextDue && !b.nextDue) return -1;
            return new Date(a.nextDue || 0) - new Date(b.nextDue || 0);
          });
          
      default:
        return appointments.sort((a, b) => {
          if (!a.nextDue && b.nextDue) return 1;
          if (a.nextDue && !b.nextDue) return -1;
          return new Date(a.nextDue || 0) - new Date(b.nextDue || 0);
        });
    }
  };

  const filteredAppointments = getFilteredAppointments();

  const handleComplete = (appointmentId) => {
    Alert.alert(
      'Подтверждение',
      'Вы уверены, что выполнили это назначение?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Выполнено', 
          onPress: () => {
            completeAppointment(appointmentId);
            // Обновляем данные после выполнения
            const pendingApps = allAppointments.filter(a => a.status === 'pending');
            setAppointments(pendingApps);
          }
        }
      ]
    );
  };

  const getAppointmentColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ff9800';
      case 'low': return '#28a745';
      default: return '#007aff';
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'В любое время';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoString;
    }
  };

  const getTimeDiff = (isoString) => {
    if (!isoString) return 'Без времени';
    try {
      const dueTime = new Date(isoString);
      const now = new Date();
      const diffMs = dueTime - now;
      const diffMins = Math.round(diffMs / (1000 * 60));
      
      if (diffMins < 0) {
        return `${Math.abs(diffMins)} мин назад`;
      } else if (diffMins < 60) {
        return `через ${diffMins} мин`;
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `через ${hours} ч ${mins} мин`;
      }
    } catch {
      return 'Время не указано';
    }
  };

  const isDueNow = (appointment) => {
    if (!appointment.nextDue) return false;
    try {
      const dueTime = new Date(appointment.nextDue);
      const now = new Date();
      const timeDiff = (dueTime - now) / (1000 * 60); // Разница в минутах
      return timeDiff >= -30 && timeDiff <= 15;
    } catch {
      return false;
    }
  };

  const renderAppointmentItem = ({ item }) => {
    const patient = patients.find(p => p.id === item.patientId);
    const isDue = isDueNow(item);
    
    return (
      <TouchableOpacity
        style={[
          nurseRouteStyles.appointmentCard,
          { 
            borderLeftWidth: 4, 
            borderLeftColor: getAppointmentColor(item.priority),
            backgroundColor: isDue ? '#fff8f8' : '#fff'
          }
        ]}
        onPress={() => patient && navigation.navigate('PatientCard', { patient })}
        activeOpacity={0.7}
      >
        <View style={nurseRouteStyles.appointmentHeader}>
          <View style={{ flex: 1 }}>
            <Text style={nurseRouteStyles.patientName} numberOfLines={1}>
              {item.patientName}
            </Text>
            <Text style={nurseRouteStyles.roomText}>Палата: {item.room}</Text>
          </View>
          
          <View style={nurseRouteStyles.timeBadge}>
            <Text style={nurseRouteStyles.timeText}>
              {formatTime(item.nextDue)}
            </Text>
            <Text style={nurseRouteStyles.timeDiff}>
              {getTimeDiff(item.nextDue)}
            </Text>
          </View>
        </View>
        
        <View style={nurseRouteStyles.appointmentBody}>
          <Text style={nurseRouteStyles.appointmentTitle} numberOfLines={2}>
            {item.name}
          </Text>
          
          {item.medication && (
            <View style={nurseRouteStyles.medicationInfo}>
              <Text style={nurseRouteStyles.detailText}>
                <Text style={{ fontWeight: '600' }}>Препарат:</Text> {item.medication.name} {item.medication.dosage}
              </Text>
              {item.relationToMeal && item.relationToMeal !== 'В любое время' && (
                <Text style={nurseRouteStyles.detailText}>
                  <Text style={{ fontWeight: '600' }}>Прием:</Text> {item.relationToMeal}
                </Text>
              )}
            </View>
          )}
          
          {item.medicalForm && (
            <View style={nurseRouteStyles.medicalFormInfo}>
              {item.medicalForm.route && (
                <Text style={nurseRouteStyles.detailText}>
                  <Text style={{ fontWeight: '600' }}>Путь:</Text> {item.medicalForm.route}
                </Text>
              )}
              {item.medicalForm.rate && (
                <Text style={nurseRouteStyles.detailText}>
                  <Text style={{ fontWeight: '600' }}>Скорость:</Text> {item.medicalForm.rate}
                </Text>
              )}
            </View>
          )}
          
          {item.instructions && (
            <Text style={[nurseRouteStyles.detailText, { fontStyle: 'italic', marginTop: 4 }]}>
              📋 {item.instructions}
            </Text>
          )}
        </View>
        
        <View style={nurseRouteStyles.appointmentFooter}>
          <View style={[
            nurseRouteStyles.priorityBadge,
            { backgroundColor: getAppointmentColor(item.priority) }
          ]}>
            <Text style={nurseRouteStyles.priorityText}>
              {item.priority === 'high' ? 'ВЫСОКИЙ' : 
               item.priority === 'medium' ? 'СРЕДНИЙ' : 'НИЗКИЙ'}
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
              {isDue ? 'СРОЧНО' : '✓ Выполнить'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const getCurrentTimeString = () => {
    return currentTime.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFilterLabel = (filterId) => {
    switch (filterId) {
      case 'upcoming': return 'Ближайшие';
      case 'urgent': return 'Срочные';
      case 'today': return 'Сегодня';
      case 'medication': return 'Лекарства';
      case 'procedures': return 'Процедуры';
      default: return 'Все';
    }
  };

  const getFilterCount = (filterId) => {
    switch (filterId) {
      case 'upcoming': return stats.upcoming;
      case 'urgent': return stats.urgent;
      case 'today': return stats.today;
      case 'medication': return stats.medication;
      case 'procedures': return stats.procedures;
      default: return 0;
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Заголовок */}
      <View style={nurseRouteStyles.header}>
        <View>
          <Text style={globalStyles.title}>Обход медсестры</Text>
          <Text style={nurseRouteStyles.subtitle}>
            {getCurrentTimeString()} • {filteredAppointments.length} назначений
          </Text>
        </View>
        
        <TouchableOpacity
          style={nurseRouteStyles.refreshButton}
          onPress={() => {
            const pendingApps = allAppointments.filter(a => a.status === 'pending');
            setAppointments(pendingApps);
          }}
        >
          <Text style={nurseRouteStyles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Фильтры с актуальными цифрами */}
      <View style={nurseRouteStyles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={nurseRouteStyles.filtersScrollContent}
        >
          {['today', 'urgent', 'upcoming', 'medication', 'procedures'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                nurseRouteStyles.filterChip,
                selectedFilter === filter && nurseRouteStyles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                nurseRouteStyles.filterChipText,
                selectedFilter === filter && nurseRouteStyles.filterChipTextActive
              ]}>
                {getFilterLabel(filter)}
              </Text>
              <View style={[
                nurseRouteStyles.filterChipBadge,
                getFilterCount(filter) === 0 && { backgroundColor: '#ccc' }
              ]}>
                <Text style={nurseRouteStyles.filterChipBadgeText}>
                  {getFilterCount(filter)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Список назначений */}
      <View style={{ flex: 1 }}>
        {filteredAppointments.length > 0 ? (
          <FlatList
            data={filteredAppointments}
            renderItem={renderAppointmentItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          />
        ) : (
          <View style={nurseRouteStyles.emptyState}>
            <Text style={nurseRouteStyles.emptyIcon}>🎉</Text>
            <Text style={nurseRouteStyles.emptyText}>
              {selectedFilter === 'upcoming' ? 'Нет ближайших назначений' :
               selectedFilter === 'urgent' ? 'Нет срочных назначений' :
               selectedFilter === 'today' ? 'Нет назначений на сегодня' :
               selectedFilter === 'medication' ? 'Нет лекарств для выдачи' :
               'Нет процедур для выполнения'}
            </Text>
            <Text style={nurseRouteStyles.emptySubtext}>
              {selectedFilter === 'upcoming' ? 'Все назначения выполнены' :
               'Проверьте другие фильтры'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}