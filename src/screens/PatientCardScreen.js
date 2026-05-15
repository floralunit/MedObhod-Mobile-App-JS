import React, { useState, useCallback } from 'react';
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
import { syncVitalSigns, getVitalSigns, getLatestVitals, getLatestNEWS } from '../services/vitalSignsSyncService';
import { syncAppointments, getPatientAppointments, completeAppointment } from '../services/appointmentSyncService';
import { useUser } from '../context/UserContext';
import { getDoctorNotes, syncDoctorNotes, addDoctorNote } from '../services/doctorNoteSyncService';
import { db } from '../db/database';

export default function PatientCardScreen({ route, navigation }) {
  const { patient } = route.params;
  const { user } = useUser();
  const userRole = user?.role;

  const [patientAppointments, setPatientAppointments] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);
  const [latestVitals, setLatestVitals] = useState(null);
  const [latestNEWS, setLatestNEWS] = useState({ newsScore: patient.newsScore || 0, status: patient.status || 'stable' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [patient.id])
  );

  const getStatusFromNEWS = (newsScore) => {
    if (newsScore >= 7) return 'critical';
    if (newsScore >= 5) return 'warning';
    return 'stable';
  };

  const getStatusText = (newsScore) => {
    if (newsScore >= 7) return 'Критическое';
    if (newsScore >= 5) return 'Требует внимания';
    return 'Стабильное';
  };

  const getStatusColor = (newsScore) => {
    if (newsScore >= 7) return '#dc3545';
    if (newsScore >= 5) return '#ff9800';
    return '#28a745';
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      if (patient.hospitalizationId) {

        const vitals = getVitalSigns(patient.hospitalizationId);
        setVitalSigns(vitals);

        const latest = getLatestVitals(patient.hospitalizationId);
        setLatestVitals(latest);

        const newsData = getLatestNEWS(patient.hospitalizationId);
        setLatestNEWS(newsData);

        try {
          await syncVitalSigns(patient.hospitalizationId);
          // Обновляем после синхронизации
          const updatedVitals = getVitalSigns(patient.hospitalizationId);
          setVitalSigns(updatedVitals);
          const updatedLatest = getLatestVitals(patient.hospitalizationId);
          setLatestVitals(updatedLatest);
          const updatedNews = getLatestNEWS(patient.hospitalizationId);
          setLatestNEWS(updatedNews);
        } catch (e) {
          //console.log('Sync skipped');
        }

        // Назначения и заметки
        await syncAppointments(patient.hospitalizationId);
        const appointments = getPatientAppointments(patient.hospitalizationId);
        setPatientAppointments(appointments);

        await syncDoctorNotes(patient.hospitalizationId);
        const notes = getDoctorNotes(patient.hospitalizationId);
        setDoctorNotes(notes);
      }
    } catch (error) {
      console.error('Failed to load patient data:', error);
    } finally {
      setLoading(false);
    }
  }, [patient.hospitalizationId]);


  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

    // Получаем текст частоты
    const getFrequencyText = (schedule) => {
      if (!schedule) return null;

      // Если есть конкретные времена — показываем их
      if (schedule.times && schedule.times.length > 0) {
        return `⏰ ${schedule.times.join(', ')}`;
      }

      // Иначе показываем частоту
      const frequencyLabels = {
        'once_daily': '1 раз в день',
        'twice_daily': '2 раза в день',
        'three_times_daily': '3 раза в день',
        'four_times_daily': '4 раза в день',
        'every_6h': 'Каждые 6 часов',
        'every_8h': 'Каждые 8 часов',
        'every_12h': 'Каждые 12 часов',
        'every_24h': 'Раз в сутки',
        'as_needed': 'По требованию',
        'stat': 'Срочно (однократно)'
      };

      const freqText = frequencyLabels[schedule.frequency] || schedule.frequency;
      if (freqText) {
        return `🔄 ${freqText}`;
      }

      return null;
    };

    const frequencyText = getFrequencyText(appointment.schedule);

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
                {appointment.medication.name || appointment.medication.customName} {appointment.medication.dosage || ''}
              </Text>
            )}

            {frequencyText && (
              <Text style={patientCardStyles.appointmentTime}>
                {frequencyText}
              </Text>
            )}

            {appointment.schedule?.startDate && (
              <Text style={patientCardStyles.appointmentDetail}>
                📅 с {new Date(appointment.schedule.startDate).toLocaleDateString('ru-RU')}
                {appointment.schedule.endDate ? ` по ${new Date(appointment.schedule.endDate).toLocaleDateString('ru-RU')}` : ''}
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
                backgroundColor: getStatusColor(latestNEWS.newsScore || 0),
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 4,
                marginRight: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                {getStatusText(latestNEWS.newsScore || 0)}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: (latestNEWS.newsScore || patient.newsScore) >= 7 ? '#dc3545' :
                  (latestNEWS.newsScore || patient.newsScore) >= 5 ? '#ff9800' : '#28a745',
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                NEWS: {latestNEWS.newsScore || patient.newsScore || 0}
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
        <View style={[globalStyles.card, { marginTop: 20, marginBottom: 30 }]}>
          <View style={patientCardStyles.appointmentsHeader}>
            <Text style={globalStyles.subtitle}>Заметки врача ({doctorNotes.length})</Text>
            {(userRole === 'doctor' || userRole === 'head') && (
              <TouchableOpacity
                style={patientCardStyles.newAppointmentButton}
                onPress={() => {
                  navigation.navigate('DoctorNoteForm', {
                    patient: patient,
                    onSave: async (note) => {
                      try {
                        await addDoctorNote(patient.hospitalizationId, user?.id, note);
                        await loadData();
                        Alert.alert('Успешно', 'Заметка добавлена');
                      } catch (error) {
                        console.error('Failed to add note:', error);
                        Alert.alert('Ошибка', 'Не удалось добавить заметку');
                      }
                    }
                  });
                }}
              >
                <Text style={patientCardStyles.newAppointmentButtonText}>+ Заметка</Text>
              </TouchableOpacity>
            )}
          </View>

          {doctorNotes.length > 0 ? (
            doctorNotes.map((note, index) => {
              //console.log(`Rendering note ${index}:`, note.id, note.noteText?.substring(0, 30));
              return (
                <View key={note.id || index} style={{
                  marginTop: index === 0 ? 10 : 20,
                  backgroundColor: '#f9f9f9',
                  padding: 15,
                  borderRadius: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: '#007aff'
                }}>
                  <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                    👨‍⚕️ {note.doctorName || 'Врач'} • {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'Дата неизвестна'}
                  </Text>
                  <Text style={{ fontSize: 16, lineHeight: 22 }}>
                    {note.noteText || 'Нет текста'}
                  </Text>
                  {note.complaints ? (
                    <Text style={{ fontSize: 14, color: '#666', marginTop: 10 }}>
                      💬 Жалобы: {note.complaints}
                    </Text>
                  ) : null}
                  {note.treatmentEffectiveness ? (
                    <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>
                      📈 Коррекция лечения: {note.treatmentEffectiveness}
                    </Text>
                  ) : null}
                </View>
              );
            })
          ) : (
            <Text style={{ textAlign: 'center', color: '#999', padding: 20 }}>
              Нет заметок
            </Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}