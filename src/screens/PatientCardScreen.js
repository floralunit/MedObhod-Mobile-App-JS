import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { globalStyles } from '../styles/globalStyles';
import { patientCardStyles } from '../styles/patientCardStyles';
import { syncVitalSigns, getVitalSigns, getLatestVitals } from '../services/vitalSignsSyncService';
import { syncAppointments, getPatientAppointments, completeAppointment } from '../services/appointmentSyncService';
import { useUser } from '../context/UserContext';

export default function PatientCardScreen({ route, navigation }) {
  const { patient } = route.params;
  const { user } = useUser();
  const userRole = user?.role;
  
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);
  const [latestVitals, setLatestVitals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

useFocusEffect(
  useCallback(() => {
    loadData();
  }, [patient.id])
);

const loadData = async () => {
  try {
    setLoading(true);
    
    console.log('=== PatientCardScreen DEBUG ===');
    console.log('Patient object:', patient);
    console.log('Patient ID:', patient.id);
    console.log('Hospitalization ID:', patient.hospitalizationId);
    
    if (patient.hospitalizationId) {
      // Синхронизация витальных показателей
      console.log('Syncing vitals for hospitalization:', patient.hospitalizationId);
      await syncVitalSigns(patient.hospitalizationId);
      
      const vitals = getVitalSigns(patient.hospitalizationId);
      console.log('Loaded vitals count:', vitals.length);
      setVitalSigns(vitals);
      
      const latest = getLatestVitals(patient.hospitalizationId);
      console.log('Latest vitals:', latest);
      setLatestVitals(latest);
      
      // Синхронизация назначений
      console.log('Syncing appointments...');
      await syncAppointments(patient.hospitalizationId);
      
      const appointments = getPatientAppointments(patient.hospitalizationId);
      console.log('Loaded appointments count:', appointments.length);
      setPatientAppointments(appointments);
    } else {
      console.warn('No hospitalizationId for patient:', patient.name);
    }
  } catch (error) {
    console.error('Failed to load patient data:', error);
  } finally {
    setLoading(false);
  }
};

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [patient.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ff9800';
      case 'stable': return '#28a745';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'critical': return 'Критическое';
      case 'warning': return 'Требует внимания';
      case 'stable': return 'Стабильное';
      default: return status || 'Неизвестно';
    }
  };

const navigateToVitalsChart = () => {
  navigation.navigate('VitalsChart', { 
    patientId: patient.id,
    patientName: patient.name,
    hospitalizationId: patient.hospitalizationId
  });
};

  const navigateToCreateAppointment = () => {
    if (userRole === 'doctor' || userRole === 'head') {
      navigation.navigate('CreateAppointment', { 
        patientId: patient.id, 
        patientName: patient.name,
        hospitalizationId: patient.hospitalizationId
      });
    } else {
      Alert.alert(
        'Доступ запрещен',
        'Создание назначений доступно только врачам и заведующим отделением'
      );
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      await completeAppointment(appointmentId, user?.id);
      await loadData(); // Обновляем список
      Alert.alert('Успешно', 'Назначение отмечено как выполненное');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отметить выполнение');
    }
  };

  // Группируем назначения по статусу
  const groupedAppointments = {
    pending: patientAppointments.filter(apt => apt.status === 'pending'),
    completed: patientAppointments.filter(apt => apt.status === 'completed')
  };

  const getAppointmentIcon = (type) => {
    switch (type) {
      case 'injection': return '💉';
      case 'iv_drip': return '💧';
      case 'medication': return '💊';
      case 'procedure': return '🩺';
      case 'dressing': return '🩹';
      case 'observation': return '🌡️';
      case 'examination': return '🔍';
      default: return '📋';
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const isAppointmentUrgent = (appointment) => {
    if (appointment.priority === 'high') return true;
    if (appointment.schedule?.times?.length > 0) {
      const now = new Date();
      const [hours, minutes] = appointment.schedule.times[0].split(':');
      const dueTime = new Date();
      dueTime.setHours(parseInt(hours), parseInt(minutes), 0);
      const timeDiff = (dueTime - now) / (1000 * 60 * 60);
      return timeDiff <= 1 && timeDiff >= 0;
    }
    return false;
  };

  const renderAppointmentItem = (appointment, isCompleted = false) => {
    const isUrgent = isAppointmentUrgent(appointment);
    
    return (
      <View key={appointment.id} style={[
        patientCardStyles.appointmentItem,
        isUrgent && patientCardStyles.urgentAppointment,
        isCompleted && patientCardStyles.completedAppointment
      ]}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <View style={[
            patientCardStyles.appointmentIcon,
            { backgroundColor: isUrgent ? '#dc3545' : '#007aff' }
          ]}>
            <Text style={{ fontSize: 16 }}>{getAppointmentIcon(appointment.type)}</Text>
          </View>
          
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={patientCardStyles.appointmentTitle}>{appointment.name}</Text>
            
            {appointment.medication && (
              <Text style={patientCardStyles.appointmentDetail}>
                {appointment.medication.name} {appointment.medication.dosage}
              </Text>
            )}
            
            {appointment.schedule?.times && appointment.schedule.times.length > 0 && (
              <Text style={patientCardStyles.appointmentTime}>
                ⏰ {appointment.schedule.times.join(', ')}
              </Text>
            )}
            
            {appointment.schedule?.relationToMeal && appointment.schedule.relationToMeal !== 'В любое время' && (
              <Text style={patientCardStyles.appointmentDetail}>
                🍽️ {appointment.schedule.relationToMeal}
              </Text>
            )}
            
            {appointment.instructions && (
              <Text style={patientCardStyles.appointmentInstruction} numberOfLines={2}>
                📋 {appointment.instructions}
              </Text>
            )}
            
            <View style={patientCardStyles.appointmentMeta}>
              <View style={[
                patientCardStyles.priorityBadge,
                { 
                  backgroundColor: 
                    appointment.priority === 'high' ? '#dc3545' :
                    appointment.priority === 'medium' ? '#ff9800' : '#28a745'
                }
              ]}>
                <Text style={patientCardStyles.priorityText}>
                  {appointment.priority === 'high' ? 'Высокий' : 
                   appointment.priority === 'medium' ? 'Средний' : 'Низкий'}
                </Text>
              </View>
              
              {isUrgent && (
                <View style={patientCardStyles.urgentBadge}>
                  <Text style={patientCardStyles.urgentText}>СРОЧНО</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {!isCompleted && userRole !== 'head' && (
          <TouchableOpacity
            style={patientCardStyles.completeButton}
            onPress={() => handleCompleteAppointment(appointment.id)}
          >
            <Text style={patientCardStyles.completeButtonText}>
              {userRole === 'nurse' ? 'Выполнить' : '✓'}
            </Text>
          </TouchableOpacity>
        )}
        
        {isCompleted && (
          <View style={patientCardStyles.completedBadge}>
            <Text style={patientCardStyles.completedText}>✓</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={{ marginTop: 16, color: '#666' }}>Загрузка данных...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView 
        style={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Заголовок и статус */}
        <View style={{ marginBottom: 20 }}>
          <Text style={globalStyles.title}>{patient.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
            <View
              style={{
                backgroundColor: getStatusColor(patient.status),
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 4,
                marginRight: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                {getStatusText(patient.status)}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: patient.newsScore >= 7 ? '#dc3545' : 
                                patient.newsScore >= 5 ? '#ff9800' : '#28a745',
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                NEWS: {patient.newsScore}
              </Text>
            </View>
          </View>
          {patient.doctorName && (
            <Text style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
              Врач: {patient.doctorName}
            </Text>
          )}
        </View>

        {/* Основная информация */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.subtitle}>Основная информация</Text>
          <View style={{ marginTop: 10 }}>
            <Text style={globalStyles.label}>Возраст</Text>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>{patient.age} лет</Text>
            
            <Text style={globalStyles.label}>Палата</Text>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>{patient.room || 'Не назначена'}</Text>
            
            <Text style={globalStyles.label}>Диагноз</Text>
            <Text style={{ fontSize: 16 }}>{patient.diagnosis || 'Не указан'}</Text>
          </View>
        </View>

        {/* Последние витальные показатели */}
        <View style={[globalStyles.card, { marginTop: 20 }]}>
          <Text style={globalStyles.subtitle}>Последние показатели</Text>
          {latestVitals ? (
            <View style={{ marginTop: 10 }}>
              <Text style={globalStyles.label}>
                Дата: {new Date(latestVitals.measuredAt).toLocaleString()}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                <View style={{ width: '50%', marginBottom: 10 }}>
                  <Text style={globalStyles.label}>Температура</Text>
                  <Text style={{ fontSize: 16 }}>{latestVitals.temperature} °C</Text>
                </View>
                <View style={{ width: '50%', marginBottom: 10 }}>
                  <Text style={globalStyles.label}>Пульс</Text>
                  <Text style={{ fontSize: 16 }}>{latestVitals.pulse} уд/мин</Text>
                </View>
                <View style={{ width: '50%', marginBottom: 10 }}>
                  <Text style={globalStyles.label}>АД</Text>
                  <Text style={{ fontSize: 16 }}>
                    {latestVitals.systolicBP}/{latestVitals.diastolicBP} мм рт.ст.
                  </Text>
                </View>
                <View style={{ width: '50%', marginBottom: 10 }}>
                  <Text style={globalStyles.label}>SpO₂</Text>
                  <Text style={{ fontSize: 16 }}>{latestVitals.spo2}%</Text>
                </View>
                <View style={{ width: '50%' }}>
                  <Text style={globalStyles.label}>ЧДД</Text>
                  <Text style={{ fontSize: 16 }}>{latestVitals.respiratoryRate} в мин</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={{ textAlign: 'center', color: '#666', padding: 20 }}>
              Нет данных о показателях
            </Text>
          )}
          <TouchableOpacity
            style={[globalStyles.blueButton, { marginTop: 15 }]}
            onPress={navigateToVitalsChart}
          >
            <Text style={globalStyles.blueButtonText}>Просмотреть график показателей</Text>
          </TouchableOpacity>
        </View>

        {/* Назначения пациента */}
        <View style={[globalStyles.card, { marginTop: 20 }]}>
          <View style={patientCardStyles.appointmentsHeader}>
            <Text style={globalStyles.subtitle}>
              Назначения ({patientAppointments.length})
            </Text>
            
            {(userRole === 'doctor' || userRole === 'head') && (
              <TouchableOpacity
                style={patientCardStyles.newAppointmentButton}
                onPress={navigateToCreateAppointment}
              >
                <Text style={patientCardStyles.newAppointmentButtonText}>+ Новое</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Активные назначения */}
          {groupedAppointments.pending.length > 0 && (
            <>
              <Text style={patientCardStyles.appointmentsSubtitle}>Активные назначения</Text>
              {groupedAppointments.pending.map(apt => renderAppointmentItem(apt, false))}
            </>
          )}
          
          {/* Выполненные назначения */}
          {groupedAppointments.completed.length > 0 && (
            <>
              <Text style={[patientCardStyles.appointmentsSubtitle, { marginTop: 20 }]}>
                Выполненные назначения ({groupedAppointments.completed.length})
              </Text>
              {groupedAppointments.completed.slice(0, 3).map(apt => renderAppointmentItem(apt, true))}
            </>
          )}
          
          {patientAppointments.length === 0 && (
            <View style={patientCardStyles.noAppointments}>
              <Text style={patientCardStyles.noAppointmentsIcon}>📋</Text>
              <Text style={patientCardStyles.noAppointmentsText}>Нет назначений</Text>
              {(userRole === 'doctor' || userRole === 'head') && (
                <TouchableOpacity
                  style={patientCardStyles.createFirstButton}
                  onPress={navigateToCreateAppointment}
                >
                  <Text style={patientCardStyles.createFirstButtonText}>Создать первое назначение</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Заметки врача */}
        {patient.notes && (
          <View style={[globalStyles.card, { marginTop: 20, marginBottom: 30 }]}>
            <Text style={globalStyles.subtitle}>Заметки врача</Text>
            <View style={{ marginTop: 10, backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8 }}>
              <Text style={{ fontSize: 16, lineHeight: 22 }}>{patient.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}