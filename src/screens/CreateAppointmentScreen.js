import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { patients } from '../data/patients';
import { appointmentTemplates, medications, addAppointment } from '../data/appointments';
import { globalStyles } from '../styles/globalStyles';

export default function CreateAppointmentScreen({ navigation, route }) {
  const { patientId, patientName } = route.params || {};
  
  const [patient, setPatient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedMedication, setSelectedMedication] = useState('');
  const [schedule, setSchedule] = useState({
    frequency: 'once',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    times: ['08:00']
  });
  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('medium');

  // Автоматически находим пациента по ID
  useEffect(() => {
    if (patientId) {
      const foundPatient = patients.find(p => p.id === patientId);
      setPatient(foundPatient);
    }
  }, [patientId]);

  // Функция для создания назначения
  const handleCreateAppointment = () => {
    if (!patient) {
      Alert.alert('Ошибка', 'Пациент не найден');
      return;
    }

    if (!selectedTemplate) {
      Alert.alert('Ошибка', 'Выберите тип назначения');
      return;
    }

    const newAppointment = {
      id: `app_${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      room: patient.room,
      type: selectedTemplate,
      name: customName || appointmentTemplates.find(t => t.id === selectedTemplate)?.name,
      medication: selectedMedication ? 
        medications.find(m => m.id.toString() === selectedMedication)?.name : 
        customName,
      schedule,
      notes,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: 'doctor1'
    };

    addAppointment(newAppointment);
    Alert.alert('Успех', 'Назначение создано', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const addTimeSlot = () => {
    setSchedule({...schedule, times: [...schedule.times, '08:00']});
  };

  // Рендер кнопок для выбора препарата
  const renderMedicationButtons = () => {
    return (
      <View style={styles.medicationContainer}>
        <Text style={globalStyles.label}>Препарат:</Text>
        <View style={styles.buttonGrid}>
          {medications.map(med => (
            <TouchableOpacity
              key={med.id}
              style={[
                styles.medicationButton,
                selectedMedication === med.id.toString() && styles.medicationButtonSelected
              ]}
              onPress={() => setSelectedMedication(med.id.toString())}
            >
              <Text style={[
                styles.medicationButtonText,
                selectedMedication === med.id.toString() && styles.medicationButtonTextSelected
              ]}>
                {med.name}
              </Text>
              <Text style={styles.medicationDosage}>{med.dosage}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (!patient) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text>Загрузка данных пациента...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={{ padding: 20 }}>
        {/* Заголовок с именем пациента */}
        <View style={{ marginBottom: 20 }}>
          <Text style={globalStyles.title}>Новое назначение</Text>
          <View style={{ 
            backgroundColor: '#e3f2fd', 
            padding: 12, 
            borderRadius: 8, 
            marginTop: 10 
          }}>
            <Text style={{ fontWeight: '600', fontSize: 16 }}>Пациент: {patient.name}</Text>
            <Text style={{ color: '#666', marginTop: 4 }}>
              Палата {patient.room} • {patient.diagnosis}
            </Text>
          </View>
        </View>

        {/* Тип назначения */}
        <View style={[globalStyles.card, { marginTop: 20 }]}>
          <Text style={globalStyles.subtitle}>Тип назначения</Text>
          <View style={styles.templateContainer}>
            {appointmentTemplates.map(template => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateButton,
                  { backgroundColor: selectedTemplate === template.id ? template.color : '#f0f0f0' },
                ]}
                onPress={() => setSelectedTemplate(template.id)}
              >
                <Text style={[
                  styles.templateButtonText,
                  { color: selectedTemplate === template.id ? '#fff' : '#333' }
                ]}>
                  {template.name}
                </Text>
                <Text style={styles.templateDuration}>{template.durationMin} мин</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Лекарство (если нужно) */}
        {(selectedTemplate === 'injection' || selectedTemplate === 'medication') && (
          <View style={[globalStyles.card, { marginTop: 20 }]}>
            <Text style={globalStyles.subtitle}>Лекарственный препарат</Text>
            {renderMedicationButtons()}
            
            <TextInput
              style={[globalStyles.input, { marginTop: 15 }]}
              placeholder="Или введите название препарата вручную"
              value={customName}
              onChangeText={setCustomName}
            />
          </View>
        )}

        {/* Расписание */}
        <View style={[globalStyles.card, { marginTop: 20 }]}>
          <Text style={globalStyles.subtitle}>Расписание</Text>
          
          <Text style={globalStyles.label}>Периодичность</Text>
          <View style={styles.frequencyContainer}>
            {[
              { value: 'once', label: 'Однократно' },
              { value: 'every_12h', label: 'Каждые 12ч' },
              { value: 'daily', label: 'Ежедневно' },
              { value: 'three_times_day', label: '3 раза в день' },
              { value: 'as_needed', label: 'По требованию' },
            ].map(freq => (
              <TouchableOpacity
                key={freq.value}
                style={[
                  styles.frequencyButton,
                  schedule.frequency === freq.value && styles.frequencyButtonSelected
                ]}
                onPress={() => setSchedule({...schedule, frequency: freq.value})}
              >
                <Text style={[
                  styles.frequencyButtonText,
                  schedule.frequency === freq.value && styles.frequencyButtonTextSelected
                ]}>
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', marginTop: 15 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={globalStyles.label}>Начало</Text>
              <TextInput
                style={globalStyles.input}
                value={schedule.startDate}
                onChangeText={(text) => setSchedule({...schedule, startDate: text})}
                placeholder="ГГГГ-ММ-ДД"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={globalStyles.label}>Окончание</Text>
              <TextInput
                style={globalStyles.input}
                value={schedule.endDate}
                onChangeText={(text) => setSchedule({...schedule, endDate: text})}
                placeholder="ГГГГ-ММ-ДД"
              />
            </View>
          </View>

          <Text style={[globalStyles.label, { marginTop: 15 }]}>Время приема</Text>
          {schedule.times.map((time, index) => (
            <TextInput
              key={index}
              style={globalStyles.input}
              value={time}
              onChangeText={(text) => {
                const newTimes = [...schedule.times];
                newTimes[index] = text;
                setSchedule({...schedule, times: newTimes});
              }}
              placeholder="ЧЧ:ММ"
            />
          ))}
          <TouchableOpacity onPress={addTimeSlot} style={styles.addTimeButton}>
            <Text style={styles.addTimeText}>+ Добавить время</Text>
          </TouchableOpacity>
        </View>

        {/* Приоритет и заметки */}
        <View style={[globalStyles.card, { marginTop: 20 }]}>
          <Text style={globalStyles.subtitle}>Дополнительно</Text>
          
          <Text style={globalStyles.label}>Приоритет</Text>
          <View style={styles.priorityContainer}>
            {[
              { level: 'low', label: 'Низкий', color: '#28a745' },
              { level: 'medium', label: 'Средний', color: '#ff9800' },
              { level: 'high', label: 'Высокий', color: '#dc3545' },
            ].map(item => (
              <TouchableOpacity
                key={item.level}
                style={[
                  styles.priorityButton,
                  { backgroundColor: priority === item.level ? item.color : '#f0f0f0' }
                ]}
                onPress={() => setPriority(item.level)}
              >
                <Text style={[
                  styles.priorityButtonText,
                  { color: priority === item.level ? '#fff' : '#333' }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[globalStyles.label, { marginTop: 15 }]}>Заметки для медсестры</Text>
          <TextInput
            style={[globalStyles.input, { height: 100, textAlignVertical: 'top' }]}
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholder="Особые указания по выполнению, аллергии, противопоказания..."
          />
        </View>

        {/* Кнопки действий */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[globalStyles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={globalStyles.buttonText}>Отмена</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[globalStyles.button, styles.createButton]}
            onPress={handleCreateAppointment}
          >
            <Text style={globalStyles.buttonText}>Создать назначение</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Типы назначений
  templateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  templateButton: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  templateButtonText: {
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  templateDuration: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.8,
  },

  // Лекарства
  medicationContainer: {
    marginTop: 10,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  medicationButton: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  medicationButtonSelected: {
    backgroundColor: '#007aff',
    borderColor: '#0056b3',
  },
  medicationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  medicationButtonTextSelected: {
    color: '#fff',
  },
  medicationDosage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // Расписание
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  frequencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  frequencyButtonSelected: {
    backgroundColor: '#007aff',
  },
  frequencyButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  frequencyButtonTextSelected: {
    color: '#fff',
  },
  addTimeButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  addTimeText: {
    color: '#007aff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Приоритет
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  priorityButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },

  // Кнопки действий
  actionButtons: {
    flexDirection: 'row',
    marginTop: 30,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    marginRight: 10,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#28a745',
  },
});