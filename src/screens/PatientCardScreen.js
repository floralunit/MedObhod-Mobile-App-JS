import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { patientCardStyles } from '../styles/patientCardStyles';
import { 
  getAppointmentsByPatient, 
  completeAppointment,
  appointmentTemplates 
} from '../data/appointments';
import { useUser } from '../context/UserContext';

export default function PatientCardScreen({ route, navigation }) {
  const { patient } = route.params;
  const { user } = useUser();
  const userRole = user?.role;

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return '#dc3545';
      case 'warning':
        return '#ff9800';
      case 'stable':
        return '#28a745';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'critical':
        return 'Критическое';
      case 'warning':
        return 'Требует внимания';
      case 'stable':
        return 'Стабильное';
      default:
        return status;
    }
  };

  // Функция для перехода на экран графиков
  const navigateToVitalsChart = () => {
    navigation.navigate('VitalsChart', { 
      vitals: patient.vitals, 
      patientName: patient.name,
      patientId: patient.id 
    });
  };

  const [patientAppointments, setPatientAppointments] = useState([]);

  useEffect(() => {
    // Загружаем назначения пациента при открытии карточки
    const appointments = getAppointmentsByPatient(patient.id);
    setPatientAppointments(appointments);
  }, [patient.id]);

  // Функция для перехода к созданию назначения (только для врача и зав. отделением)
  const navigateToCreateAppointment = () => {
    if (userRole === 'doctor' || userRole === 'head') {
      navigation.navigate('CreateAppointment', { 
        patientId: patient.id, 
        patientName: patient.name 
      });
    } else {
      Alert.alert(
        'Доступ запрещен',
        'Создание назначений доступно только врачам и заведующим отделением'
      );
    }
  };

  // Функция для отметки выполнения назначения
  const handleCompleteAppointment = (appointmentId) => {
    completeAppointment(appointmentId);
    // Обновляем список назначений
    const updatedAppointments = getAppointmentsByPatient(patient.id);
    setPatientAppointments(updatedAppointments);
  };

  // Группируем назначения по статусу
  const groupedAppointments = useMemo(() => {
    const pending = patientAppointments.filter(apt => apt.status === 'pending');
    const completed = patientAppointments.filter(apt => apt.status === 'completed');
    
    // Сортируем по времени выполнения
    pending.sort((a, b) => {
      if (!a.nextDue || !b.nextDue) return 0;
      return new Date(a.nextDue) - new Date(b.nextDue);
    });
    
    return { pending, completed };
  }, [patientAppointments]);

  // Получаем цвет для типа назначения
  const getAppointmentColor = (type) => {
    const template = appointmentTemplates.find(t => t.type === type);
    return template ? template.color : '#007aff';
  };

  // Получаем иконку для типа назначения
  const getAppointmentIcon = (type) => {
    switch (type) {
      case 'injection':
      case 'iv_drip':
        return '💉';
      case 'medication':
        return '💊';
      case 'procedure':
      case 'dressing':
        return '🩺';
      case 'observation':
        return '🌡️';
      case 'examination':
        return '🔍';
      default:
        return '📋';
    }
  };

  // Форматируем время
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Проверяем, является ли назначение срочным
  const isAppointmentUrgent = (appointment) => {
    if (appointment.priority === 'high') return true;
    
    // Проверяем, нужно ли выполнить в ближайший час
    if (appointment.nextDue) {
      const dueTime = new Date(appointment.nextDue);
      const now = new Date();
      const timeDiff = (dueTime - now) / (1000 * 60 * 60); // Разница в часах
      return timeDiff <= 1 && timeDiff >= 0;
    }
    
    return false;
  };

  // Рендер одного назначения
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
            { backgroundColor: getAppointmentColor(appointment.type) }
          ]}>
            <Text style={{ fontSize: 16 }}>
              {getAppointmentIcon(appointment.type)}
            </Text>
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
                {appointment.nextDue && ` (след.: ${formatTime(appointment.nextDue)})`}
              </Text>
            )}
            
            {appointment.relationToMeal && appointment.relationToMeal !== 'В любое время' && (
              <Text style={patientCardStyles.appointmentDetail}>
                🍽️ {appointment.relationToMeal}
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
        
        {!isCompleted && userRole !== 'head' && ( // Зав. отделением не выполняет назначения
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

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={{ padding: 20 }}>
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
        </View>

        {/* Основная информация */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.subtitle}>Основная информация</Text>
          <View style={{ marginTop: 10 }}>
            <Text style={globalStyles.label}>Возраст</Text>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>{patient.age} лет</Text>
            
            <Text style={globalStyles.label}>Палата</Text>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>{patient.room}</Text>
            
            <Text style={globalStyles.label}>Диагноз</Text>
            <Text style={{ fontSize: 16 }}>{patient.diagnosis}</Text>
          </View>
        </View>

        {/* Последние витальные показатели */}
        <View style={[globalStyles.card, { marginTop: 20 }]}>
          <Text style={globalStyles.subtitle}>Последние показатели</Text>
          {patient.vitals && patient.vitals.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={globalStyles.label}>
                Дата: {patient.vitals[patient.vitals.length - 1].time}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                <View style={{ width: '50%', marginBottom: 10 }}>
                  <Text style={globalStyles.label}>Температура</Text>
                  <Text style={{ fontSize: 16 }}>
                    {patient.vitals[patient.vitals.length - 1].temp} °C
                  </Text>
                </View>
                <View style={{ width: '50%', marginBottom: 10 }}>
                  <Text style={globalStyles.label}>Пульс</Text>
                  <Text style={{ fontSize: 16 }}>
                    {patient.vitals[patient.vitals.length - 1].pulse} уд/мин
                  </Text>
                </View>
                <View style={{ width: '50%', marginBottom: 10 }}>
                  <Text style={globalStyles.label}>АД</Text>
                  <Text style={{ fontSize: 16 }}>
                    {patient.vitals[patient.vitals.length - 1].bp} мм рт.ст.
                  </Text>
                </View>
                <View style={{ width: '50%', marginBottom: 10 }}>
                  <Text style={globalStyles.label}>SpO₂</Text>
                  <Text style={{ fontSize: 16 }}>
                    {patient.vitals[patient.vitals.length - 1].spo2}%
                  </Text>
                </View>
                <View style={{ width: '50%' }}>
                  <Text style={globalStyles.label}>ЧДД</Text>
                  <Text style={{ fontSize: 16 }}>
                    {patient.vitals[patient.vitals.length - 1].rr} в мин
                  </Text>
                </View>
              </View>
            </View>
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
            
            {/* Кнопка "Новое назначение" показывается только врачам и заведующим */}
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
              {groupedAppointments.pending.map(apt => renderAppointmentItem(apt))}
            </>
          )}
          
          {/* Выполненные назначения */}
          {groupedAppointments.completed.length > 0 && (
            <>
              <Text style={[patientCardStyles.appointmentsSubtitle, { marginTop: 20 }]}>
                Выполненные назначения
              </Text>
              {groupedAppointments.completed.map(apt => renderAppointmentItem(apt, true))}
            </>
          )}
          
          {/* Нет назначений */}
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
        <View style={[globalStyles.card, { marginTop: 20, marginBottom: 30 }]}>
          <Text style={globalStyles.subtitle}>Заметки врача</Text>
          <View style={{ marginTop: 10, backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8 }}>
            <Text style={{ fontSize: 16, lineHeight: 22 }}>{patient.notes}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}