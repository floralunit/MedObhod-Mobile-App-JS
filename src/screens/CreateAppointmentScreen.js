import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { createAppointmentStyles } from '../styles/createAppointmentStyles';
import { generateTimeSlots } from '../utils/appointmentUtils';
import { getPatientById } from '../services/patientSyncService';
import { getAppointmentTemplates, getMedications } from '../services/dictionaryService';
import { createAppointment } from '../services/appointmentSyncService';
import { useUser } from '../context/UserContext';

// Конфигурация
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
  const { patientId, patientName, hospitalizationId } = route.params || {};
  const { user } = useUser();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [medicationsList, setMedicationsList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [customMedication, setCustomMedication] = useState({
    name: '',
    dosage: '',
    form: ''
  });
  const [isCreating, setIsCreating] = useState(false); // ДОБАВЛЕНО для защиты от двойного нажатия

  const [schedule, setSchedule] = useState({
    frequency: 'once_daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    startTime: '08:00',
    daysCount: 1,
    relationToMeal: SCREEN_CONFIG.MEDICATION_TIMES.ANY_TIME,
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

  // Загрузка данных
  useEffect(() => {
    loadInitialData();
  }, [patientId, hospitalizationId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setLoadingData(true);

      // Загружаем пациента
      if (patientId) {
        const patientData = await getPatientById(patientId);
        setPatient(patientData);
      }

      // Загружаем справочники
      const templatesData = await getAppointmentTemplates();
      const medicationsData = await getMedications();

      setTemplates(templatesData);
      setMedicationsList(medicationsData);

    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
      setLoadingData(false);
    }
  };

  // Обновляем временные слоты при изменении частоты
  useEffect(() => {
    const newTimes = generateTimeSlots(schedule.frequency, schedule.startTime);
    setSchedule(prev => ({ ...prev, times: newTimes }));
  }, [schedule.frequency, schedule.startTime]);

  const getTemplateDetails = (templateId) => {
    return templates.find(t => t.id === templateId);
  };

  const handleCreateAppointment = async () => {
    // Защита от повторного нажатия
    if (isCreating) {
      console.log('Already creating, skipping');
      return;
    }

    if (!patient) {
      Alert.alert('Ошибка', 'Пациент не найден');
      return;
    }

    if (!selectedTemplate) {
      Alert.alert('Ошибка', 'Выберите тип назначения');
      return;
    }

    const template = getTemplateDetails(selectedTemplate);
    if (template?.requiresMedication && !selectedMedication && !customMedication.name) {
      Alert.alert('Ошибка', 'Выберите или введите название препарата');
      return;
    }

    // Формируем название назначения
    let appointmentName = template.name;
    if (selectedMedication) {
      const med = medicationsList.find(m => m.id === selectedMedication);
      appointmentName = `${med.name} ${med.dosage} - ${template.name}`;
    } else if (customMedication.name) {
      appointmentName = `${customMedication.name} ${customMedication.dosage} - ${template.name}`;
    }

    const appointmentData = {
      hospitalizationId: patient.hospitalizationId || hospitalizationId,
      templateId: selectedTemplate,
      type: template.type,
      name: appointmentName,
      priority: priority,
      durationMin: parseInt(duration) || 15,
      instructions: instructions,
      notes: notes,
      schedule: {
        frequency: schedule.frequency,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        startTime: schedule.startTime,
        relationToMeal: schedule.relationToMeal,
        times: schedule.times
      },
      medication: selectedMedication ?
        medicationsList.find(m => m.id === selectedMedication) :
        (customMedication.name ? {
          customName: customMedication.name,
          dosage: customMedication.dosage,
          form: customMedication.form
        } : null)
    };

    setIsCreating(true); // Блокируем повторное нажатие

    try {
      await createAppointment(appointmentData); // ТОЛЬКО ОДИН ВЫЗОВ!
      Alert.alert('Успех', 'Назначение создано', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Failed to create appointment:', error);
      Alert.alert('Ошибка', 'Не удалось создать назначение');
    } finally {
      setIsCreating(false);
    }
  };


  const renderMedicationSection = () => {
    const template = getTemplateDetails(selectedTemplate);
    if (!template || !template.requiresMedication) return null;

    return (
      <View style={[globalStyles.card, { marginTop: 20 }]}>
        <Text style={globalStyles.subtitle}>Лекарственный препарат</Text>

        <View style={createAppointmentStyles.medicationContainer}>
          <Text style={globalStyles.label}>Выберите из базы:</Text>
          <View style={createAppointmentStyles.medicationGrid}>
            {medicationsList.map(med => (
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
                    {med.defaultDosage}
                  </Text>
                  <Text style={createAppointmentStyles.medicationForm}>
                    {med.form}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={createAppointmentStyles.customMedicationContainer}>
          <Text style={globalStyles.label}>Или введите вручную:</Text>
          <View style={createAppointmentStyles.customMedicationRow}>
            <TextInput
              style={[globalStyles.input, createAppointmentStyles.dosageInput]}
              placeholder="Название"
              value={customMedication.name}
              onChangeText={(text) => {
                setCustomMedication({ ...customMedication, name: text });
                setSelectedMedication(null);
              }}
            />
            <TextInput
              style={[globalStyles.input, createAppointmentStyles.dosageInput]}
              placeholder="Дозировка"
              value={customMedication.dosage}
              onChangeText={(text) => setCustomMedication({ ...customMedication, dosage: text })}
            />
          </View>
          <TextInput
            style={[globalStyles.input, { marginTop: 10 }]}
            placeholder="Форма выпуска (таблетки, ампулы и т.д.)"
            value={customMedication.form}
            onChangeText={(text) => setCustomMedication({ ...customMedication, form: text })}
          />
        </View>
      </View>
    );
  };

  const renderScheduleSection = () => (
    <View style={[globalStyles.card, { marginTop: 20 }]}>
      <Text style={globalStyles.subtitle}>Расписание</Text>

      <Text style={globalStyles.label}>Периодичность</Text>
      <View style={createAppointmentStyles.frequencyContainer}>
        {Object.values(SCREEN_CONFIG.FREQUENCIES).map(freq => (
          <TouchableOpacity
            key={freq.id}
            style={[
              createAppointmentStyles.frequencyButton,
              schedule.frequency === freq.id && createAppointmentStyles.frequencyButtonSelected
            ]}
            onPress={() => setSchedule({ ...schedule, frequency: freq.id })}
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

      <View style={{ flexDirection: 'row', marginTop: 15 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={globalStyles.label}>Начало</Text>
          <TextInput
            style={globalStyles.input}
            value={schedule.startDate}
            onChangeText={(text) => setSchedule({ ...schedule, startDate: text })}
            placeholder="ГГГГ-ММ-ДД"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={globalStyles.label}>Окончание</Text>
          <TextInput
            style={globalStyles.input}
            value={schedule.endDate}
            onChangeText={(text) => setSchedule({ ...schedule, endDate: text })}
            placeholder="ГГГГ-ММ-ДД"
          />
        </View>
      </View>

      <Text style={[globalStyles.label, { marginTop: 15 }]}>Первое время приема</Text>
      <TextInput
        style={globalStyles.input}
        value={schedule.startTime}
        onChangeText={(text) => setSchedule({ ...schedule, startTime: text })}
        placeholder="ЧЧ:ММ"
      />

      {selectedTemplate && getTemplateDetails(selectedTemplate)?.type === 'medication' && (
        <View style={createAppointmentStyles.relationToMealContainer}>
          <Text style={globalStyles.label}>Относительно приема пищи</Text>
          <View style={createAppointmentStyles.relationToMealGrid}>
            {Object.values(SCREEN_CONFIG.MEDICATION_TIMES).map(time => (
              <TouchableOpacity
                key={time}
                style={[
                  createAppointmentStyles.relationToMealButton,
                  schedule.relationToMeal === time && createAppointmentStyles.relationToMealButtonSelected
                ]}
                onPress={() => setSchedule({ ...schedule, relationToMeal: time })}
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
              setSchedule({ ...schedule, times: newTimes });
            }}
            placeholder="ЧЧ:ММ"
          />
          {schedule.times.length > 1 && (
            <TouchableOpacity
              style={createAppointmentStyles.timeSlotRemove}
              onPress={() => {
                const newTimes = [...schedule.times];
                newTimes.splice(index, 1);
                setSchedule({ ...schedule, times: newTimes });
              }}
            >
              <Text style={createAppointmentStyles.timeSlotRemoveText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  if (loading || loadingData) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={{ marginTop: 16, color: '#666' }}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text>Пациент не найден</Text>
          <TouchableOpacity
            style={{ marginTop: 20, padding: 10, backgroundColor: '#007aff', borderRadius: 8 }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#fff' }}>Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={{ padding: 20 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={globalStyles.title}>Новое назначение</Text>
          <View style={{
            backgroundColor: '#e3f2fd',
            padding: 12,
            borderRadius: 8,
            marginTop: 10
          }}>
            <Text style={{ fontWeight: '600', fontSize: 16 }}>Пациент: {patient.fullName || patient.name}</Text>
            <Text style={{ color: '#666', marginTop: 4 }}>
              Палата {patient.room || 'не указана'}
            </Text>
          </View>
        </View>

        <View style={[globalStyles.card, { marginTop: 20 }]}>
          <Text style={globalStyles.subtitle}>Тип назначения</Text>
          <View style={createAppointmentStyles.templateContainer}>
            {templates.map(template => (
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

        {renderMedicationSection()}
        {renderScheduleSection()}

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

        <View style={createAppointmentStyles.actionButtons}>
          <TouchableOpacity
            style={[globalStyles.button, createAppointmentStyles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={isCreating}
          >
            <Text style={globalStyles.buttonText}>Отмена</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              globalStyles.button,
              createAppointmentStyles.createButton,
              isCreating && { opacity: 0.5 } // Визуальный индикатор
            ]}
            onPress={handleCreateAppointment}
            disabled={isCreating} // Блокируем кнопку при создании
          >
            <Text style={globalStyles.buttonText}>
              {isCreating ? 'Создание...' : 'Создать назначение'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}