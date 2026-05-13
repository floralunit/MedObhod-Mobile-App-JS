import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DoctorNoteForm({ route, navigation }) {
  const { patient, onSave } = route.params;

  const [note, setNote] = useState({
    complaints: '',
    examination: '',
    treatmentChanges: '',
    notes: ''
  });

  const handleSave = () => {
    if (!note.complaints && !note.examination && !note.notes) {
      Alert.alert('Ошибка', 'Заполните хотя бы одно поле');
      return;
    }

    onSave(note);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Дневник осмотра</Text>
        <Text style={styles.patientName}>{patient.name} • Палата {patient.room}</Text>

        <Text style={styles.label}>Жалобы пациента:</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={3}
          value={note.complaints}
          onChangeText={(text) => setNote({ ...note, complaints: text })}
          placeholder="Опишите жалобы пациента..."
        />

        <Text style={styles.label}>Результаты осмотра:</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          value={note.examination}
          onChangeText={(text) => setNote({ ...note, examination: text })}
          placeholder="Объективные данные осмотра..."
        />

        <Text style={styles.label}>Коррекция лечения:</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={3}
          value={note.treatmentChanges}
          onChangeText={(text) => setNote({ ...note, treatmentChanges: text })}
          placeholder="Изменения в назначениях..."
        />

        <Text style={styles.label}>Заметки:</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={3}
          value={note.notes}
          onChangeText={(text) => setNote({ ...note, notes: text })}
          placeholder="Дополнительные заметки..."
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Сохранить</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  patientName: { fontSize: 16, color: '#666', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlignVertical: 'top'
  },
  saveButton: {
    backgroundColor: '#007aff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' }
});