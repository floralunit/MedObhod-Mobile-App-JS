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
import { patients } from '../data/patients';
import { globalStyles } from '../styles/globalStyles';
import { doctorRouteStyles } from '../styles/doctorRouteStyles';

const { width } = Dimensions.get('window');

export default function DoctorRouteScreen({ navigation, route }) {
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('round'); // По умолчанию "Обход"
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);

  // Обновляем время каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Загружаем пациентов врача (в будущем - фильтр по врачу)
  useEffect(() => {
    // В демо-версии показываем всех пациентов
    const sortedPatients = [...patients].sort((a, b) => {
      // Сортировка по приоритету: критические > требующие внимания > стабильные
      const priorityOrder = { critical: 0, warning: 1, stable: 2 };
      return priorityOrder[a.status] - priorityOrder[b.status];
    });
    
    setDoctorPatients(sortedPatients);
  }, []);

  // Фильтрация пациентов
  const getFilteredPatients = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    switch (selectedFilter) {
      case 'round':
        // Для обхода - все пациенты врача, отсортированные по NEWS-2
        return doctorPatients.sort((a, b) => b.newsScore - a.newsScore);
        
      case 'critical':
        // Критические пациенты
        return doctorPatients.filter(p => p.status === 'critical')
          .sort((a, b) => b.newsScore - a.newsScore);
          
      case 'needReview':
        // Пациенты, требующие пересмотра терапии
        return doctorPatients.filter(p => 
          p.status === 'warning' || 
          p.newsScore >= 5
        ).sort((a, b) => b.newsScore - a.newsScore);
        
      case 'newPatients':
        // Новые пациенты (в демо - с последними назначениями)
        return doctorPatients.filter(p => {
          // В демо: пациенты с назначениями, созданными вчера-сегодня
          return p.appointments && p.appointments.some(app => {
            const createdAt = new Date(app.createdAt);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return createdAt >= yesterday;
          });
        });
        
      default:
        return doctorPatients;
    }
  };

  const filteredPatients = getFilteredPatients();
  const currentPatient = filteredPatients[currentPatientIndex];

  // Рассчитываем статистику
  const getStats = () => {
    const critical = doctorPatients.filter(p => p.status === 'critical').length;
    const warning = doctorPatients.filter(p => p.status === 'warning').length;
    const stable = doctorPatients.filter(p => p.status === 'stable').length;
    const highNEWS = doctorPatients.filter(p => p.newsScore >= 5).length;
    
    return {
      critical,
      warning,
      stable,
      highNEWS,
      total: doctorPatients.length
    };
  };

  const stats = getStats();

  // Обработка завершения визита
  const handleCompleteVisit = () => {
    Alert.alert(
      'Завершить визит',
      'Завершить осмотр пациента и перейти к следующему?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Завершить и продолжить', 
          onPress: () => {
            if (currentPatientIndex < filteredPatients.length - 1) {
              setCurrentPatientIndex(prev => prev + 1);
            } else {
              Alert.alert('Обход завершен', 'Все пациенты осмотрены');
            }
          }
        },
        { 
          text: 'Завершить обход', 
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
          }
        }
      ]
    );
  };

  // Создание нового назначения
  const handleCreateAppointment = () => {
    if (currentPatient) {
      navigation.navigate('CreateAppointment', {
        patientId: currentPatient.id,
        patientName: currentPatient.name
      });
    }
  };

  // Добавление заметки врача
  const handleAddNote = () => {
    if (currentPatient) {
      Alert.prompt(
        'Добавить врачебную заметку',
        'Введите заметку по осмотру пациента:',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Сохранить',
            onPress: (note) => {
              if (note && note.trim()) {
                // В реальном приложении здесь будет запись в БД
                Alert.alert('Заметка сохранена', 'Заметка добавлена в историю болезни');
              }
            }
          }
        ],
        'plain-text'
      );
    }
  };

  // Визуализация NEWS-2
  const renderNEWSScore = (score) => {
    let color = '#28a745'; // зеленый
    if (score >= 5) color = '#ff9800'; // оранжевый
    if (score >= 7) color = '#dc3545'; // красный
    
    return (
      <View style={[doctorRouteStyles.newsBadge, { backgroundColor: color }]}>
        <Text style={doctorRouteStyles.newsText}>NEWS-2: {score}</Text>
      </View>
    );
  };

  // Статус пациента
  const renderStatusBadge = (status) => {
    const statusConfig = {
      critical: { color: '#dc3545', text: 'Критический' },
      warning: { color: '#ff9800', text: 'Требует внимания' },
      stable: { color: '#28a745', text: 'Стабильный' }
    };
    
    const config = statusConfig[status] || { color: '#6c757d', text: 'Неизвестно' };
    
    return (
      <View style={[doctorRouteStyles.statusBadge, { backgroundColor: config.color }]}>
        <Text style={doctorRouteStyles.statusText}>{config.text}</Text>
      </View>
    );
  };

  // Визуализация динамики показателей
  const renderVitalsTrend = (patient) => {
    if (!patient.vitals || patient.vitals.length < 2) return null;
    
    const lastVitals = patient.vitals[patient.vitals.length - 1];
    const prevVitals = patient.vitals[patient.vitals.length - 2];
    
    const getTrend = (current, previous, isHigherBetter = false) => {
      const diff = parseFloat(current) - parseFloat(previous);
      if (diff > 0) return isHigherBetter ? '↑ улучшение' : '↑ ухудшение';
      if (diff < 0) return isHigherBetter ? '↓ ухудшение' : '↓ улучшение';
      return '→ стабильно';
    };
    
    return (
      <View style={doctorRouteStyles.trendContainer}>
        <Text style={doctorRouteStyles.trendTitle}>Динамика показателей (последние 2 измерения):</Text>
        
        <View style={doctorRouteStyles.trendRow}>
          <Text style={doctorRouteStyles.trendLabel}>Температура:</Text>
          <Text style={doctorRouteStyles.trendValue}>
            {lastVitals.temp}°C {getTrend(lastVitals.temp, prevVitals.temp, false)}
          </Text>
        </View>
        
        <View style={doctorRouteStyles.trendRow}>
          <Text style={doctorRouteStyles.trendLabel}>ЧСС:</Text>
          <Text style={doctorRouteStyles.trendValue}>
            {lastVitals.pulse} уд/мин {getTrend(lastVitals.pulse, prevVitals.pulse, false)}
          </Text>
        </View>
        
        <View style={doctorRouteStyles.trendRow}>
          <Text style={doctorRouteStyles.trendLabel}>АД:</Text>
          <Text style={doctorRouteStyles.trendValue}>
            {lastVitals.bp} {getTrend(
              parseFloat(lastVitals.bp.split('/')[0]), 
              parseFloat(prevVitals.bp.split('/')[0]),
              false
            )}
          </Text>
        </View>
        
        <View style={doctorRouteStyles.trendRow}>
          <Text style={doctorRouteStyles.trendLabel}>Сатурация:</Text>
          <Text style={doctorRouteStyles.trendValue}>
            {lastVitals.spo2}% {getTrend(lastVitals.spo2, prevVitals.spo2, true)}
          </Text>
        </View>
      </View>
    );
  };

  // Список назначений пациента
  const renderPatientAppointments = (patient) => {
    if (!patient.appointments || patient.appointments.length === 0) {
      return (
        <View style={doctorRouteStyles.noAppointments}>
          <Text style={doctorRouteStyles.noAppointmentsText}>
            Нет активных назначений
          </Text>
        </View>
      );
    }
    
    return (
      <View style={doctorRouteStyles.appointmentsContainer}>
        <Text style={doctorRouteStyles.sectionTitle}>Текущие назначения:</Text>
        
        {patient.appointments
          .filter(app => app.status === 'pending')
          .slice(0, 3) // Показываем только 3 последних
          .map(appointment => (
            <View key={appointment.id} style={doctorRouteStyles.appointmentItem}>
              <View style={doctorRouteStyles.appointmentHeader}>
                <Text style={doctorRouteStyles.appointmentName}>
                  {appointment.name}
                </Text>
                <View style={[
                  doctorRouteStyles.priorityBadge,
                  { 
                    backgroundColor: 
                      appointment.priority === 'high' ? '#dc3545' :
                      appointment.priority === 'medium' ? '#ff9800' : '#28a745'
                  }
                ]}>
                  <Text style={doctorRouteStyles.priorityText}>
                    {appointment.priority === 'high' ? 'Срочно' : 'Обычно'}
                  </Text>
                </View>
              </View>
              
              {appointment.instructions && (
                <Text style={doctorRouteStyles.appointmentInstructions}>
                  {appointment.instructions}
                </Text>
              )}
              
              {appointment.nextDue && (
                <Text style={doctorRouteStyles.appointmentTime}>
                  Следующее выполнение: {
                    new Date(appointment.nextDue).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  }
                </Text>
              )}
            </View>
          ))}
      </View>
    );
  };

  // Основной экран пациента для обхода
  const renderPatientCard = () => {
    if (!currentPatient) {
      return (
        <View style={doctorRouteStyles.noPatients}>
          <Text style={doctorRouteStyles.noPatientsText}>Нет пациентов для обхода</Text>
        </View>
      );
    }
    
    return (
      <ScrollView 
        style={doctorRouteStyles.patientCard}
        showsVerticalScrollIndicator={false}
      >
        {/* Заголовок карты пациента */}
        <View style={doctorRouteStyles.patientHeader}>
          <View>
            <Text style={doctorRouteStyles.patientName}>
              {currentPatient.name}
            </Text>
            <Text style={doctorRouteStyles.patientDetails}>
              {currentPatient.age} лет • Палата {currentPatient.room}
            </Text>
          </View>
          
          <View style={doctorRouteStyles.patientStatusContainer}>
            {renderNEWSScore(currentPatient.newsScore)}
            {renderStatusBadge(currentPatient.status)}
          </View>
        </View>
        
        {/* Диагноз */}
        <View style={doctorRouteStyles.diagnosisContainer}>
          <Text style={doctorRouteStyles.diagnosisLabel}>Диагноз:</Text>
          <Text style={doctorRouteStyles.diagnosisText}>
            {currentPatient.diagnosis}
          </Text>
        </View>
        
        {/* Последние витальные показатели */}
        <View style={doctorRouteStyles.vitalsContainer}>
          <Text style={doctorRouteStyles.sectionTitle}>Последние показатели:</Text>
          
          {currentPatient.vitals && currentPatient.vitals.length > 0 ? (
            <View style={doctorRouteStyles.vitalsGrid}>
              <View style={doctorRouteStyles.vitalItem}>
                <Text style={doctorRouteStyles.vitalLabel}>Температура</Text>
                <Text style={doctorRouteStyles.vitalValue}>
                  {currentPatient.vitals[currentPatient.vitals.length - 1].temp}°C
                </Text>
              </View>
              
              <View style={doctorRouteStyles.vitalItem}>
                <Text style={doctorRouteStyles.vitalLabel}>ЧСС</Text>
                <Text style={doctorRouteStyles.vitalValue}>
                  {currentPatient.vitals[currentPatient.vitals.length - 1].pulse} уд/мин
                </Text>
              </View>
              
              <View style={doctorRouteStyles.vitalItem}>
                <Text style={doctorRouteStyles.vitalLabel}>АД</Text>
                <Text style={doctorRouteStyles.vitalValue}>
                  {currentPatient.vitals[currentPatient.vitals.length - 1].bp}
                </Text>
              </View>
              
              <View style={doctorRouteStyles.vitalItem}>
                <Text style={doctorRouteStyles.vitalLabel}>SpO₂</Text>
                <Text style={doctorRouteStyles.vitalValue}>
                  {currentPatient.vitals[currentPatient.vitals.length - 1].spo2}%
                </Text>
              </View>
            </View>
          ) : (
            <Text style={doctorRouteStyles.noVitalsText}>Нет данных о показателях</Text>
          )}
        </View>
        
        {/* Динамика показателей */}
        {renderVitalsTrend(currentPatient)}
        
        {/* Назначения */}
        {renderPatientAppointments(currentPatient)}
        
        {/* Заметки врача */}
        {currentPatient.notes && (
          <View style={doctorRouteStyles.notesContainer}>
            <Text style={doctorRouteStyles.sectionTitle}>Заметки врача:</Text>
            <Text style={doctorRouteStyles.notesText}>
              {currentPatient.notes}
            </Text>
          </View>
        )}
        
        {/* Прогресс обхода */}
        <View style={doctorRouteStyles.progressContainer}>
          <Text style={doctorRouteStyles.progressText}>
            Пациент {currentPatientIndex + 1} из {filteredPatients.length}
          </Text>
          <View style={doctorRouteStyles.progressBar}>
            <View 
              style={[
                doctorRouteStyles.progressFill,
                { width: `${((currentPatientIndex + 1) / filteredPatients.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </ScrollView>
    );
  };

  // Список пациентов (миниатюры)
  const renderPatientList = () => (
    <FlatList
      data={filteredPatients}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={[
            doctorRouteStyles.patientListItem,
            currentPatientIndex === index && doctorRouteStyles.patientListItemActive
          ]}
          onPress={() => setCurrentPatientIndex(index)}
        >
          <View style={doctorRouteStyles.listPatientInfo}>
            <Text style={doctorRouteStyles.listPatientName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={doctorRouteStyles.listPatientRoom}>
              Палата {item.room} • {item.diagnosis}
            </Text>
          </View>
          
          <View style={doctorRouteStyles.listPatientStatus}>
            {renderNEWSScore(item.newsScore)}
            {renderStatusBadge(item.status)}
          </View>
        </TouchableOpacity>
      )}
      keyExtractor={item => item.id.toString()}
      showsVerticalScrollIndicator={false}
      style={{ maxHeight: 200 }}
    />
  );

  // Фильтры
  const getFilterLabel = (filterId) => {
    switch (filterId) {
      case 'round': return 'Обход';
      case 'critical': return 'Критические';
      case 'needReview': return 'Требуют пересмотра';
      case 'newPatients': return 'Новые';
      default: return 'Все';
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Заголовок */}
      <View style={doctorRouteStyles.header}>
        <View>
          <Text style={globalStyles.title}>Врачебный обход</Text>
          <Text style={doctorRouteStyles.subtitle}>
            {currentTime.toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })} • {stats.total} пациентов
          </Text>
        </View>
        
        <TouchableOpacity
          style={doctorRouteStyles.statsButton}
          onPress={() => Alert.alert('Статистика', 
            `Всего: ${stats.total} пациентов\n` +
            `Критические: ${stats.critical}\n` +
            `Требуют внимания: ${stats.warning}\n` +
            `Стабильные: ${stats.stable}\n` +
            `NEWS-2 ≥ 5: ${stats.highNEWS}`
          )}
        >
          <Text style={doctorRouteStyles.statsButtonText}>📊 Статистика</Text>
        </TouchableOpacity>
      </View>

      {/* Фильтры */}
      <View style={doctorRouteStyles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={doctorRouteStyles.filtersScrollContent}
        >
          {['round', 'critical', 'needReview', 'newPatients'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                doctorRouteStyles.filterChip,
                selectedFilter === filter && doctorRouteStyles.filterChipActive
              ]}
              onPress={() => {
                setSelectedFilter(filter);
                setCurrentPatientIndex(0); // Сброс на первого пациента
              }}
            >
              <Text style={[
                doctorRouteStyles.filterChipText,
                selectedFilter === filter && doctorRouteStyles.filterChipTextActive
              ]}>
                {getFilterLabel(filter)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Быстрый список пациентов */}
      <View style={doctorRouteStyles.patientListContainer}>
        <Text style={doctorRouteStyles.patientListTitle}>
          Пациенты ({filteredPatients.length})
        </Text>
        {renderPatientList()}
      </View>

      {/* Основная карта пациента */}
      <View style={doctorRouteStyles.mainCardContainer}>
        {renderPatientCard()}
      </View>

      {/* Кнопки действий врача */}
      <View style={doctorRouteStyles.actionButtons}>
        <TouchableOpacity
          style={[doctorRouteStyles.actionButton, doctorRouteStyles.noteButton]}
          onPress={handleAddNote}
        >
          <Text style={doctorRouteStyles.actionButtonText}>📝 Заметка</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[doctorRouteStyles.actionButton, doctorRouteStyles.appointmentButton]}
          onPress={handleCreateAppointment}
        >
          <Text style={doctorRouteStyles.actionButtonText}>💊 Назначить</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[doctorRouteStyles.actionButton, doctorRouteStyles.completeButton]}
          onPress={handleCompleteVisit}
        >
          <Text style={doctorRouteStyles.actionButtonText}>
            ✓ Завершить визит
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}