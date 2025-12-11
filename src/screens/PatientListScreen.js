import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { patients } from '../data/patients';

export default function PatientListScreen({ navigation }) {

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("PatientCard", { patient: item })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.small}>Палата {item.room}</Text>
      <Text style={styles.small}>Диагноз: {item.diagnosis}</Text>

      <Text style={[
        styles.status,
        item.status === "critical" && { color: "red" },
        item.status === "warning" && { color: "orange" },
        item.status === "stable" && { color: "green" }
      ]}>
        {item.status.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Список пациентов</Text>

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 20 },
  item: {
    padding: 15,
    backgroundColor: "#f7f7f7",
    marginBottom: 12,
    borderRadius: 12
  },
  name: { fontSize: 18, fontWeight: '600' },
  small: { fontSize: 14, opacity: 0.7, marginTop: 3 },
  status: { marginTop: 8, fontSize: 14, fontWeight: "700" }
});
