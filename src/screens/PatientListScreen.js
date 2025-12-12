import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patients } from '../data/patients';
import { patientStyles } from '../styles/patientStyles';
import { globalStyles } from '../styles/globalStyles';

export default function PatientListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Функция для фильтрации пациентов
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) {
      return patients;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return patients.filter(patient => {
      const matchesName = patient.name.toLowerCase().includes(query);
      const matchesRoom = patient.room.toLowerCase().includes(query);
      const matchesDiagnosis = patient.diagnosis.toLowerCase().includes(query);
      
      return matchesName || matchesRoom || matchesDiagnosis;
    });
  }, [searchQuery]);

  // Функция для получения стиля статуса
  const getStatusStyle = (status) => {
    switch (status) {
      case 'critical':
        return patientStyles.statusCritical;
      case 'warning':
        return patientStyles.statusWarning;
      case 'stable':
        return patientStyles.statusStable;
      default:
        return {};
    }
  };

  // Функция для получения русского текста статуса
  const getStatusText = (status) => {
    switch (status) {
      case 'critical':
        return 'КРИТИЧЕСКОЕ';
      case 'warning':
        return 'ТРЕБУЕТ ВНИМАНИЯ';
      case 'stable':
        return 'СТАБИЛЬНОЕ';
      default:
        return status.toUpperCase();
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={patientStyles.patientCard}
      onPress={() => navigation.navigate('PatientCard', { patient: item })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={patientStyles.patientName}>{item.name}</Text>
          <Text style={patientStyles.patientInfo}>Возраст: {item.age} лет</Text>
          <Text style={patientStyles.patientInfo}>Диагноз: {item.diagnosis}</Text>
          <Text style={patientStyles.patientRoom}>Палата: {item.room}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[globalStyles.label, { marginBottom: 4 }]}>NEWS</Text>
          <View
            style={{
              backgroundColor: item.newsScore >= 7 ? '#dc3545' : 
                              item.newsScore >= 5 ? '#ff9800' : '#28a745',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
              {item.newsScore}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[patientStyles.patientStatus, getStatusStyle(item.status)]}>
        {getStatusText(item.status)}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={patientStyles.emptyState}>
      <Text style={{ fontSize: 48 }}>👨‍⚕️</Text>
      <Text style={patientStyles.emptyText}>
        {searchQuery.trim()
          ? `Пациенты по запросу "${searchQuery}" не найдены`
          : 'Список пациентов пуст'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={patientStyles.searchContainer}>
        <Text style={globalStyles.title}>Список пациентов</Text>
        <TextInput
          style={patientStyles.searchInput}
          placeholder="Поиск по ФИО, палате или диагнозу..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.trim() && (
          <Text style={[globalStyles.label, { textAlign: 'right' }]}>
            Найдено: {filteredPatients.length} пациентов
          </Text>
        )}
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={patientStyles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}