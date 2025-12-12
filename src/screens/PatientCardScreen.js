import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { getAppointmentsByPatient, addAppointment } from '../data/appointments';

export default function PatientCardScreen({ route, navigation }) {
  const { patient } = route.params;

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

// Функция для перехода к созданию назначения
const navigateToCreateAppointment = () => {
  navigation.navigate('CreateAppointment', { patientId: patient.id, patientName: patient.name });
};

// Функция для отметки выполнения назначения
const handleCompleteAppointment = (appointmentId) => {
  // В реальном приложении здесь будет вызов функции из appointments.js
  const updated = patientAppointments.map(apt => 
    apt.id === appointmentId ? { ...apt, status: 'completed' } : apt
  );
  setPatientAppointments(updated);
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
            style={[globalStyles.button, { marginTop: 15 }]}
            onPress={navigateToVitalsChart}
          >
            <Text style={globalStyles.buttonText}>Просмотреть график показателей</Text>
          </TouchableOpacity>
        </View>

        {/* Заметки врача */}
        <View style={[globalStyles.card, { marginTop: 20, marginBottom: 30 }]}>
          <Text style={globalStyles.subtitle}>Заметки врача</Text>
          <View style={{ marginTop: 10, backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8 }}>
            <Text style={{ fontSize: 16, lineHeight: 22 }}>{patient.notes}</Text>
          </View>
        </View>
        <View style={[globalStyles.card, { marginTop: 20 }]}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
    <Text style={globalStyles.subtitle}>Назначения</Text>
    <TouchableOpacity
      style={{
        backgroundColor: '#007aff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
      }}
      onPress={navigateToCreateAppointment}
    >
      <Text style={{ color: '#fff', fontWeight: '600' }}>+ Новое</Text>
    </TouchableOpacity>
  </View>
  
  {patientAppointments.length > 0 ? (
    patientAppointments.map((apt, index) => (
      <View key={index} style={[
        styles.appointmentItem,
        apt.status === 'completed' && { opacity: 0.6 }
      ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[
            styles.appointmentIcon,
            { backgroundColor: 
              apt.type === 'injection' ? '#FF6B6B' : 
              apt.type === 'medication' ? '#4ECDC4' : '#45B7D1' }
          ]}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
              {apt.type === 'injection' ? '💉' : apt.type === 'medication' ? '💊' : '🩺'}
            </Text>
          </View>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ fontWeight: '600', fontSize: 16 }}>{apt.name}</Text>
            {apt.medication && (
              <Text style={{ fontSize: 14, color: '#666' }}>{apt.medication}</Text>
            )}
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {apt.schedule?.times?.join(', ')}
              {apt.priority === 'high' && ' • ⚡ Срочно'}
            </Text>
          </View>
        </View>
        
        {apt.status === 'pending' ? (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteAppointment(apt.id)}
          >
            <Text style={styles.completeButtonText}>Выполнить</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Выполнено ✓</Text>
          </View>
        )}
      </View>
    ))
  ) : (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 10 }}>📋</Text>
      <Text style={{ color: '#999', textAlign: 'center' }}>
        Нет активных назначений
      </Text>
    </View>
  )}
</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... существующие стили ...
  
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  appointmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completedText: {
    color: '#28a745',
    fontSize: 12,
    fontWeight: '600',
  }
});