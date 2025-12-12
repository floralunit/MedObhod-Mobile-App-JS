import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patients } from '../data/patients';
import { 
  appointmentTemplates, 
  medications, 
  addAppointment
} from '../data/appointments';
import { globalStyles } from '../styles/globalStyles';
import { createAppointmentStyles } from '../styles/createAppointmentStyles';
import { generateTimeSlots } from '../utils/appointmentUtils';

// Локальная конфигурация для экрана - перемещена В НАЧАЛО
const SCREEN_CONFIG = {
  MEDICATION_TIMES: {
    BEFORE_MEAL: 'За 30 минут до еды',
    WITH_MEAL: 'Во время еды',
    AFTER_MEAL: 'Через 30 минут после еды',
    ON_EMPTY_STOMACH: 'Натощак',
    BEFORE_SLEEP: 'Перед сном',
    ANY_TIME: 'В любое время'
  },
  
  FREQUENCIES: {
    ONCE_DAILY: { id: 'once_daily', label: '1 раз в день' },
    TWICE_DAILY: { id: 'twice_daily', label: '2 раза в день' },
    THREE_TIMES_DAILY: { id: 'three_times_daily', label: '3 раза в день' },
    FOUR_TIMES_DAILY: { id: 'four_times_daily', label: '4 раза в день' },
    EVERY_6_HOURS: { id: 'every_6h', label: 'Каждые 6 часов' },
    EVERY_8_HOURS: { id: 'every_8h', label: 'Каждые 8 часов' },
    EVERY_12_HOURS: { id: 'every_12h', label: 'Каждые 12 часов' },
    EVERY_24_HOURS: { id: 'every_24h', label: 'Раз в сутки' },
    AS_NEEDED: { id: 'as_needed', label: 'По требованию' },
    STAT: { id: 'stat', label: 'Срочно (однократно)' }
  },
  
  APPOINTMENT_TYPES: {
    MEDICATION: 'medication',
    INJECTION: 'injection',
    IV_DRIP: 'iv_drip',
    PROCEDURE: 'procedure',
    EXAMINATION: 'examination',
    CONSULTATION: 'consultation',
    DRESSING: 'dressing',
    PHYSIOTHERAPY: 'physiotherapy',
    LAB_TEST: 'lab_test',
    DIET: 'diet',
    OBSERVATION: 'observation'
  }
};

export default function CreateAppointmentScreen({ navigation, route }) {
  const { patientId, patientName } = route.params || {};
  
  const [patient, setPatient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [customMedication, setCustomMedication] = useState({
    name: '',
    dosage: '',
    form: ''
  });
  
  const [schedule, setSchedule] = useState({
    frequency: 'once_daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    startTime: '08:00',
    daysCount: 1,
    relationToMeal: SCREEN_CONFIG.MEDICATION_TIMES.ANY_TIME, // Исправлено: SCREEN_CONFIG вместо HOSPITAL_CONFIG
    times: ['08:00']
  });
  
  const [notes, setNotes] = useState('');
  const [instructions, setInstructions] = useState('');
  const [priority, setPriority] = useState('medium');
  const [duration, setDuration] = useState('15');
  const [medicalForm, setMedicalForm] = useState({
    route: '',
    site: '',
    rate: ''
  });

  // Автоматически находим пациента по ID
  useEffect(() => {
    if (patientId) {
      const foundPatient = patients.find(p => p.id === patientId);
      setPatient(foundPatient);
    }
  }, [patientId]);

  // Обновляем временные слоты при изменении частоты
  useEffect(() => {
    const newTimes = generateTimeSlots(schedule.frequency, schedule.startTime);
    setSchedule(prev => ({ ...prev, times: newTimes }));
  }, [schedule.frequency, schedule.startTime]);

  const getTemplateDetails = (templateId) => {
    return appointmentTemplates.find(t => t.id === templateId);
  };

  const handleCreateAppointment = () => {
    if (!patient) {
      Alert.alert('Ошибка', 'Пациент не найден');
      return;
    }

    if (!selectedTemplate) {
      Alert.alert('Ошибка', 'Выберите тип назначения');
      return;
    }

    const template = getTemplateDetails(selectedTemplate);
    if (template.requiresMedication && !selectedMedication && !customMedication.name) {
      Alert.alert('Ошибка', 'Выберите или введите название препарата');
      return;
    }

    // Формируем название назначения
    let appointmentName = template.name;
    if (selectedMedication) {
      const med = medications.find(m => m.id === selectedMedication);
      appointmentName = `${med.name} ${med.dosage} - ${template.name}`;
    } else if (customMedication.name) {
      appointmentName = `${customMedication.name} ${customMedication.dosage} - ${template.name}`;
    }

    const newAppointment = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId: patient.id,
      patientName: patient.name,
      room: patient.room,
      type: template.type,
      templateId: selectedTemplate,
      name: appointmentName,
      medication: selectedMedication ? 
        medications.find(m => m.id === selectedMedication) : 
        customMedication.name ? customMedication : null,
      schedule,
      duration: parseInt(duration) || 15,
      instructions,
      notes,
      priority,
      medicalForm: template.type === 'iv_drip' || template.type === 'injection' ? medicalForm : null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: 'doctor1',
      relationToMeal: schedule.relationToMeal
    };

    addAppointment(newAppointment);
    Alert.alert('Успех', 'Назначение создано', [
      { 
        text: 'OK', 
        onPress: () => navigation.goBack() 
      },
      {
        text: 'Создать еще',
        onPress: () => {
          // Сброс формы для нового назначения
          setSelectedMedication(null);
          setCustomMedication({ name: '', dosage: '', form: '' });
          setSchedule({
            frequency: 'once_daily',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            startTime: '08:00',
            daysCount: 1,
            relationToMeal: SCREEN_CONFIG.MEDICATION_TIMES.ANY_TIME, // Исправлено
            times: ['08:00']
          });
          setInstructions('');
          setNotes('');
        }
      }
    ]);
  };

  const renderMedicationSection = () => {
    const template = getTemplateDetails(selectedTemplate);
    if (!template || !template.requiresMedication) return null;

    return (
      <View style={[globalStyles.card, { marginTop: 20 }]}>
        <Text style={globalStyles.subtitle}>Лекарственный препарат</Text>
        
        {/* Выбор из базы лекарств */}
        <View style={createAppointmentStyles.medicationContainer}>
          <Text style={globalStyles.label}>Выберите из базы:</Text>
          <View style={createAppointmentStyles.medicationGrid}>
            {medications.map(med => (
              <TouchableOpacity
                key={med.id}
                style={[
                  createAppointmentStyles.medicationButton,
                  selectedMedication === med.id && createAppointmentStyles.medicationButtonSelected
                ]}
                onPress={() => {
                  setSelectedMedication(med.id);
                  setCustomMedication({ name: '', dosage: '', form: '' });
                }}
              >
                <View style={createAppointmentStyles.categoryBadge}>
                  <Text style={createAppointmentStyles.categoryText}>
                    {med.category}
                  </Text>
                </View>
                <Text style={[
                  createAppointmentStyles.medicationButtonText,
                  selectedMedication === med.id && createAppointmentStyles.medicationButtonTextSelected
                ]}>
                  {med.name}
                </Text>
                <View style={createAppointmentStyles.medicationDetails}>
                  <Text style={createAppointmentStyles.medicationDosage}>
                    {med.dosage}
                  </Text>
                  <Text style={createAppointmentStyles.medicationForm}>
                    {med.form}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ручной ввод */}
        <View style={createAppointmentStyles.customMedicationContainer}>
          <Text style={globalStyles.label}>Или введите вручную:</Text>
          <View style={createAppointmentStyles.customMedicationRow}>
            <TextInput
              style={[globalStyles.input, createAppointmentStyles.dosageInput]}
              placeholder="Название"
              value={customMedication.name}
              onChangeText={(text) => {
                setCustomMedication({...customMedication, name: text});
                setSelectedMedication(null);
              }}
            />
            <TextInput
              style={[globalStyles.input, createAppointmentStyles.dosageInput]}
              placeholder="Дозировка"
              value={customMedication.dosage}
              onChangeText={(text) => setCustomMedication({...customMedication, dosage: text})}
            />
          </View>
          <TextInput
            style={[globalStyles.input, { marginTop: 10 }]}
            placeholder="Форма выпуска (таблетки, ампулы и т.д.)"
            value={customMedication.form}
            onChangeText={(text) => setCustomMedication({...customMedication, form: text})}
          />
        </View>
      </View>
    );
  };

  const renderScheduleSection = () => (
    <View style={[globalStyles.card, { marginTop: 20 }]}>
      <Text style={globalStyles.subtitle}>Расписание</Text>
      
      {/* Частота */}
      <Text style={globalStyles.label}>Периодичность</Text>
      <View style={createAppointmentStyles.frequencyContainer}>
        {Object.values(SCREEN_CONFIG.FREQUENCIES).map(freq => ( // Исправлено: SCREEN_CONFIG
          <TouchableOpacity
            key={freq.id}
            style={[
              createAppointmentStyles.frequencyButton,
              schedule.frequency === freq.id && createAppointmentStyles.frequencyButtonSelected
            ]}
            onPress={() => setSchedule({...schedule, frequency: freq.id})}
          >
            <Text style={[
              createAppointmentStyles.frequencyButtonText,
              schedule.frequency === freq.id && createAppointmentStyles.frequencyButtonTextSelected
            ]}>
              {freq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Даты */}
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

      {/* Начальное время */}
      <Text style={[globalStyles.label, { marginTop: 15 }]}>Первое время приема</Text>
      <TextInput
        style={globalStyles.input}
        value={schedule.startTime}
        onChangeText={(text) => setSchedule({...schedule, startTime: text})}
        placeholder="ЧЧ:ММ"
      />

      {/* Относительно приема пищи */}
      {selectedTemplate && getTemplateDetails(selectedTemplate).type === 'medication' && (
        <View style={createAppointmentStyles.relationToMealContainer}>
          <Text style={globalStyles.label}>Относительно приема пищи</Text>
          <View style={createAppointmentStyles.relationToMealGrid}>
            {Object.values(SCREEN_CONFIG.MEDICATION_TIMES).map(time => ( // Исправлено: SCREEN_CONFIG
              <TouchableOpacity
                key={time}
                style={[
                  createAppointmentStyles.relationToMealButton,
                  schedule.relationToMeal === time && createAppointmentStyles.relationToMealButtonSelected
                ]}
                onPress={() => setSchedule({...schedule, relationToMeal: time})}
              >
                <Text style={[
                  createAppointmentStyles.relationToMealText,
                  schedule.relationToMeal === time && createAppointmentStyles.relationToMealTextSelected
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Временные слоты */}
      <Text style={[globalStyles.label, { marginTop: 15 }]}>Время выполнения:</Text>
      {schedule.times.map((time, index) => (
        <View key={index} style={createAppointmentStyles.timeSlotContainer}>
          <Text style={createAppointmentStyles.timeSlotLabel}>
            Прием {index + 1}:
          </Text>
          <TextInput
            style={createAppointmentStyles.timeSlotInput}
            value={time}
            onChangeText={(text) => {
              const newTimes = [...schedule.times];
              newTimes[index] = text;
              setSchedule({...schedule, times: newTimes});
            }}
            placeholder="ЧЧ:ММ"
          />
          {schedule.times.length > 1 && (
            <TouchableOpacity
              style={createAppointmentStyles.timeSlotRemove}
              onPress={() => {
                const newTimes = [...schedule.times];
                newTimes.splice(index, 1);
                setSchedule({...schedule, times: newTimes});
              }}
            >
              <Text style={createAppointmentStyles.timeSlotRemoveText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderMedicalFormSection = () => {
    const template = getTemplateDetails(selectedTemplate);
    if (!template || (template.type !== 'iv_drip' && template.type !== 'injection')) {
      return null;
    }

    return (
      <View style={[globalStyles.card, { marginTop: 20 }]}>
        <Text style={globalStyles.subtitle}>Медицинская форма</Text>
        
        <View style={createAppointmentStyles.medicalFormContainer}>
          <View style={createAppointmentStyles.formRow}>
            <View style={createAppointmentStyles.formInputHalf}>
              <Text style={globalStyles.label}>Путь введения</Text>
              <TextInput
                style={globalStyles.input}
                value={medicalForm.route}
                onChangeText={(text) => setMedicalForm({...medicalForm, route: text})}
                placeholder="в/м, в/в, п/к"
              />
            </View>
            <View style={createAppointmentStyles.formInputHalf}>
              <Text style={globalStyles.label}>Место введения</Text>
              <TextInput
                style={globalStyles.input}
                value={medicalForm.site}
                onChangeText={(text) => setMedicalForm({...medicalForm, site: text})}
                placeholder="правое/левое плечо, ягодица"
              />
            </View>
          </View>
          
          {template.type === 'iv_drip' && (
            <View style={createAppointmentStyles.formInputFull}>
              <Text style={globalStyles.label}>Скорость инфузии</Text>
              <TextInput
                style={globalStyles.input}
                value={medicalForm.rate}
                onChangeText={(text) => setMedicalForm({...medicalForm, rate: text})}
                placeholder="капель в минуту"
              />
            </View>
          )}
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
          <View style={createAppointmentStyles.templateContainer}>
            {appointmentTemplates.map(template => (
              <TouchableOpacity
                key={template.id}
                style={[
                  createAppointmentStyles.templateButton,
                  { backgroundColor: selectedTemplate === template.id ? template.color : '#f0f0f0' },
                ]}
                onPress={() => setSelectedTemplate(template.id)}
              >
                <Text style={[
                  createAppointmentStyles.templateButtonText,
                  { color: selectedTemplate === template.id ? '#fff' : '#333' }
                ]}>
                  {template.name}
                </Text>
                <Text style={createAppointmentStyles.templateDuration}>
                  {template.durationMin} мин
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Лекарства */}
        {renderMedicationSection()}

        {/* Расписание */}
        {renderScheduleSection()}

        {/* Медицинская форма */}
        {renderMedicalFormSection()}

        {/* Продолжительность */}
        <View style={[globalStyles.card, { marginTop: 20 }]}>
          <Text style={globalStyles.subtitle}>Продолжительность</Text>
          <View style={createAppointmentStyles.durationContainer}>
            <TextInput
              style={[globalStyles.input, createAppointmentStyles.durationInput]}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="15"
            />
            <Text style={createAppointmentStyles.durationLabel}>минут</Text>
          </View>
        </View>

        {/* Инструкции и заметки */}
        <View style={[globalStyles.card, { marginTop: 20 }]}>
          <Text style={globalStyles.subtitle}>Инструкции</Text>
          
          <Text style={globalStyles.label}>Техника выполнения</Text>
          <TextInput
            style={createAppointmentStyles.instructionInput}
            multiline
            numberOfLines={4}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Подробные инструкции по выполнению процедуры..."
          />
          
          <Text style={[globalStyles.label, { marginTop: 15 }]}>Заметки для медсестры</Text>
          <TextInput
            style={[globalStyles.input, { height: 80, textAlignVertical: 'top' }]}
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholder="Особые указания, аллергии, противопоказания..."
          />
        </View>

        {/* Приоритет */}
        <View style={[globalStyles.card, { marginTop: 20 }]}>
          <Text style={globalStyles.subtitle}>Приоритет</Text>
          <View style={createAppointmentStyles.priorityContainer}>
            {[
              { level: 'low', label: 'Низкий', color: '#28a745' },
              { level: 'medium', label: 'Средний', color: '#ff9800' },
              { level: 'high', label: 'Высокий', color: '#dc3545' },
            ].map(item => (
              <TouchableOpacity
                key={item.level}
                style={[
                  createAppointmentStyles.priorityButton,
                  { backgroundColor: priority === item.level ? item.color : '#f0f0f0' }
                ]}
                onPress={() => setPriority(item.level)}
              >
                <Text style={[
                  createAppointmentStyles.priorityButtonText,
                  { color: priority === item.level ? '#fff' : '#333' }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Кнопки действий */}
        <View style={createAppointmentStyles.actionButtons}>
          <TouchableOpacity
            style={[globalStyles.button, createAppointmentStyles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={globalStyles.buttonText}>Отмена</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[globalStyles.button, createAppointmentStyles.createButton]}
            onPress={handleCreateAppointment}
          >
            <Text style={globalStyles.buttonText}>Создать назначение</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Удалите следующий блок кода из этого файла:
// Он должен находиться в отдельном файле констант (например, src/constants/hospitalConfig.js)