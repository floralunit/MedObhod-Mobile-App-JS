import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { patientStyles } from '../styles/patientStyles';
import { globalStyles } from '../styles/globalStyles';
import { getLocalPatients, syncPatients } from '../services/patientSyncService';

export default function PatientListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPatients = async () => {
    try {
      // Синхронизация с сервером
      await syncPatients();
      // Загрузка из локальной БД (с учетом роли)
      const localPatients = await getLocalPatients();
      setPatients(localPatients);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  // Фильтрация пациентов
  const filteredPatients = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return patients;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return patients.filter(patient => {
      const matchesName = patient.name?.toLowerCase().includes(query);
      const matchesRoom = patient.room?.toLowerCase().includes(query);
      return matchesName || matchesRoom;
    });
  }, [searchQuery, patients]);

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

  const getStatusText = (status) => {
    switch (status) {
      case 'critical':
        return 'КРИТИЧЕСКОЕ';
      case 'warning':
        return 'ТРЕБУЕТ ВНИМАНИЯ';
      case 'stable':
        return 'СТАБИЛЬНОЕ';
      default:
        return status?.toUpperCase() || 'НЕИЗВЕСТНО';
    }
  };

  const renderItem = ({ item }) => (
  <TouchableOpacity
    style={patientStyles.patientCard}
    onPress={() => navigation.navigate('PatientCard', { 
      patient: {
        id: item.id,
        name: item.name,
        age: item.age,
        room: item.room,
        status: item.status,
        newsScore: item.newsScore,
        diagnosis: item.diagnosis,
        hospitalizationId: item.hospitalizationId,
        doctorName: item.doctorName,
        notes: item.notes
      }
    })}
  >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={patientStyles.patientName}>{item.name}</Text>
          <Text style={patientStyles.patientInfo}>Возраст: {item.age} лет</Text>
          <Text style={patientStyles.patientInfo}>Диагноз: {item.diagnosis}</Text>
          <Text style={patientStyles.patientRoom}>Палата: {item.room}</Text>
          {item.doctorName && (
            <Text style={patientStyles.patientDoctor}>Врач: {item.doctorName}</Text>
          )}
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
          : loading ? 'Загрузка...' : 'Список пациентов пуст'}
      </Text>
    </View>
  );

  if (loading && patients.length === 0) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={{ marginTop: 16, color: '#666' }}>Загрузка пациентов...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={patientStyles.searchContainer}>
        <Text style={globalStyles.title}>Список пациентов</Text>
        <TextInput
          style={patientStyles.searchInput}
          placeholder="Поиск по ФИО или палате..."
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
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={patientStyles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}