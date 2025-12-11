import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function PatientCardScreen({ route }) {
  const { patient } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{patient.name}</Text>
      <Text style={styles.section}>Возраст: {patient.age}</Text>
      <Text style={styles.section}>Палата: {patient.room}</Text>
      <Text style={styles.section}>Диагноз: {patient.diagnosis}</Text>

      <Text style={styles.blockTitle}>Витальные показатели</Text>

      <View style={styles.block}>
        <Text>Температура: {patient.vitals.temp}</Text>
        <Text>Пульс: {patient.vitals.pulse}</Text>
        <Text>АД: {patient.vitals.bp}</Text>
        <Text>SpO₂: {patient.vitals.spo2}%</Text>
        <Text>ЧДД: {patient.vitals.rr}</Text>
      </View>

      <Text style={styles.blockTitle}>NEWS Score: {patient.newsScore}</Text>

      <Text style={styles.blockTitle}>Заметки врача</Text>
      <View style={styles.block}>
        <Text>{patient.notes}</Text>
      </View>
      {/* <TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate("VitalsChart", { vitals: patient.vitals })}
>
  <Text style={styles.buttonText}>График витальных</Text>
</TouchableOpacity> */}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 10 },
  section: { fontSize: 16, marginBottom: 5 },

  blockTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10
  },
  block: {
    backgroundColor: '#f4f4f4',
    padding: 12,
    borderRadius: 10
  },
  button: {
  marginTop: 20,
  backgroundColor: '#007aff',
  padding: 14,
  borderRadius: 10,
  alignItems: 'center'
},
buttonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600'
}

});
