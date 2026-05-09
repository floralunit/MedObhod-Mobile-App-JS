import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAllPatients, getDoctorsForAssignment, assignPatientToDoctor, syncPatients } from '../services/patientSyncService';
import { globalStyles } from '../styles/globalStyles';

export default function ManagePatientsScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const loadData = async () => {
    try {
      await syncPatients();
      const patientsList = getAllPatients();
      const doctorsList = getDoctorsForAssignment();
      setPatients(patientsList);
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAssign = async (doctorId) => {
    if (!selectedPatient) return;
    
    try {
      await assignPatientToDoctor(
        selectedPatient.id, 
        doctorId, 
        selectedPatient.hospitalizationId
      );
      Alert.alert('Успешно', 'Пациент назначен врачу');
      setShowAssignModal(false);
      setSelectedPatient(null);
      await loadData();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось назначить пациента');
    }
  };

  const groupPatientsByDoctor = () => {
    const grouped = {};
    patients.forEach(patient => {
      const doctorName = patient.doctorName || 'Не назначен';
      if (!grouped[doctorName]) {
        grouped[doctorName] = [];
      }
      grouped[doctorName].push(patient);
    });
    return grouped;
  };

  const groupedPatients = groupPatientsByDoctor();

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ff9800';
      default: return '#28a745';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'critical': return 'Критический';
      case 'warning': return 'Требует внимания';
      default: return 'Стабильный';
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text style={globalStyles.title}>Управление пациентами</Text>
        <Text style={styles.subtitle}>Распределение пациентов по врачам</Text>
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.content}
      >
        {Object.entries(groupedPatients).map(([doctorName, doctorPatients]) => (
          <View key={doctorName} style={styles.doctorSection}>
            <View style={styles.doctorHeader}>
              <Text style={styles.doctorName}>{doctorName}</Text>
              <Text style={styles.patientCount}>{doctorPatients.length} пациентов</Text>
            </View>
            
            {doctorPatients.map(patient => (
              <View key={patient.id} style={styles.patientCard}>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.fullName}</Text>
                  <Text style={styles.patientRoom}>Палата {patient.room}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(patient.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(patient.status)}</Text>
                  </View>
                </View>
                
                {doctorName === 'Не назначен' && (
                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => {
                      setSelectedPatient(patient);
                      setShowAssignModal(true);
                    }}
                  >
                    <Text style={styles.assignButtonText}>Назначить врача</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ))}
        
        {patients.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Нет пациентов</Text>
          </View>
        )}
      </ScrollView>

      {/* Модальное окно назначения врача */}
      <Modal
        visible={showAssignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Назначить врача</Text>
            <Text style={styles.modalPatient}>
              Пациент: {selectedPatient?.fullName}
            </Text>
            
            {doctors.map(doctor => (
              <TouchableOpacity
                key={doctor.id}
                style={styles.doctorOption}
                onPress={() => handleAssign(doctor.id)}
              >
                <Text style={styles.doctorOptionName}>{doctor.fullName}</Text>
                <Text style={styles.doctorOptionLogin}>{doctor.login}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAssignModal(false)}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  doctorSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007aff',
  },
  patientCount: {
    fontSize: 12,
    color: '#666',
  },
  patientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  patientRoom: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  assignButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalPatient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  doctorOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  doctorOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  doctorOptionLogin: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
};