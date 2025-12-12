import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { getPendingAppointments, completeAppointment } from '../data/appointments';
import { patients } from '../data/patients';
import { globalStyles } from '../styles/globalStyles';

const { width } = Dimensions.get('window');

export default function NurseRouteScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [selectedTime, setSelectedTime] = useState('current');

  // Обновляем список назначений
  useEffect(() => {
    const pendingApps = getPendingAppointments();
    setAppointments(pendingApps);
  }, []);

  // Оптимизация маршрута - исправленный useMemo
  const optimizedRoute = useMemo(() => {
    if (appointments.length === 0) return [];
    
    const route = [...appointments];
    
    // Сортируем по:
    // 1. Приоритету (высокий -> низкий)
    // 2. Номеру палаты (для оптимизации пути)
    route.sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      // Простая оптимизация по номеру палаты
      const roomA = parseInt(a.room) || 0;
      const roomB = parseInt(b.room) || 0;
      return roomA - roomB;
    });
    
    return route;
  }, [appointments]);

  const handleComplete = (appointmentId) => {
    completeAppointment(appointmentId);
    setAppointments(getPendingAppointments());
  };

  const getAppointmentColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ff9800';
      case 'low': return '#28a745';
      default: return '#007aff';
    }
  };

  const renderAppointmentItem = ({ item, index }) => {
    const patient = patients.find(p => p.id === item.patientId);
    
    return (
      <TouchableOpacity
        style={[
          styles.appointmentCard,
          { borderLeftWidth: 4, borderLeftColor: getAppointmentColor(item.priority) }
        ]}
        onPress={() => navigation.navigate('PatientCard', { patient })}
      >
        <View style={styles.appointmentHeader}>
          <View>
            <Text style={styles.patientName}>{item.patientName}</Text>
            <Text style={styles.roomText}>Палата: {item.room}</Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>{index + 1}</Text>
          </View>
        </View>
        
        <View style={styles.appointmentBody}>
          <Text style={styles.appointmentTitle}>{item.name}</Text>
          
          {item.medication && (
            <Text style={styles.detailText}>Препарат: {item.medication}</Text>
          )}
          
          {item.schedule && item.schedule.times && (
            <Text style={styles.detailText}>
              Время: {item.schedule.times.join(', ')}
            </Text>
          )}
          
          {item.notes && (
            <Text style={[styles.detailText, { fontStyle: 'italic', marginTop: 5 }]}>
              📝 {item.notes}
            </Text>
          )}
        </View>
        
        <View style={styles.appointmentFooter}>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getAppointmentColor(item.priority) }
          ]}>
            <Text style={styles.priorityText}>
              {item.priority === 'high' ? 'ВЫСОКИЙ' : 
               item.priority === 'medium' ? 'СРЕДНИЙ' : 'НИЗКИЙ'}
            </Text>
          </View>
          
          {item.status === 'pending' && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleComplete(item.id)}
            >
              <Text style={styles.completeButtonText}>Выполнено ✓</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRouteMap = () => (
    <View style={styles.routeMapContainer}>
      <Text style={styles.sectionTitle}>Карта маршрута</Text>
      <View style={styles.floorPlan}>
        {optimizedRoute.map((appointment, index) => (
          <View key={appointment.id} style={styles.routePoint}>
            <View style={[styles.pointMarker, {
              backgroundColor: getAppointmentColor(appointment.priority)
            }]}>
              <Text style={styles.pointNumber}>{index + 1}</Text>
            </View>
            <Text style={styles.pointLabel}>Пал. {appointment.room}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text style={globalStyles.title}>Маршрут обхода</Text>
        <Text style={styles.subtitle}>
          Назначений к выполнению: {appointments.length}
        </Text>
      </View>

      {/* Фильтр по времени */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeFilter}>
        {['Текущие', 'Утренние', 'Дневные', 'Вечерние', 'Все'].map((time) => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeButton,
              selectedTime === time.toLowerCase() && styles.timeButtonActive
            ]}
            onPress={() => setSelectedTime(time.toLowerCase())}
          >
            <Text style={[
              styles.timeButtonText,
              selectedTime === time.toLowerCase() && styles.timeButtonTextActive
            ]}>
              {time}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Статистика */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Всего</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#dc3545' }]}>
            {appointments.filter(a => a.priority === 'high').length}
          </Text>
          <Text style={styles.statLabel}>Срочные</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ff9800' }]}>
            {appointments.filter(a => a.priority === 'medium').length}
          </Text>
          <Text style={styles.statLabel}>Средние</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#28a745' }]}>
            {appointments.filter(a => a.priority === 'low').length}
          </Text>
          <Text style={styles.statLabel}>Плановые</Text>
        </View>
      </View>

      <ScrollView style={{ padding: 20 }}>
        {renderRouteMap()}
        
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Пошаговый маршрут</Text>
          
          {optimizedRoute.length > 0 ? (
            <FlatList
              data={optimizedRoute}
              renderItem={renderAppointmentItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyText}>Все назначения выполнены!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  timeFilter: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
  },
  timeButtonActive: {
    backgroundColor: '#007aff',
  },
  timeButtonText: {
    fontWeight: '600',
    color: '#333',
  },
  timeButtonTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 5,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  routeMapContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  floorPlan: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
  },
  routePoint: {
    alignItems: 'center',
    margin: 10,
  },
  pointMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointNumber: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  pointLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  roomText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  appointmentBody: {
    marginBottom: 12,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});