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
import { SafeScreen } from '../components/SafeScreen';

export default function PatientListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // PatientListScreen.js
  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [])
  );

  const loadPatients = async () => {
    setLoading(true);
    try {
      // Сначала загружаем локальные данные
      const localPatients = await getLocalPatients();
      setPatients(localPatients);

      // Потом пробуем синхронизировать
      try {
        await syncPatients();
        // После синхронизации обновляем список
        const updatedPatients = await getLocalPatients();
        setPatients(updatedPatients);
      } catch (syncError) {
        console.log('Sync failed, using local data');
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusFromNEWS = (newsScore) => {
    if (newsScore >= 7) return 'critical';
    if (newsScore >= 5) return 'warning';
    return 'stable';
  };

  const getStatusText = (newsScore) => {
    if (newsScore >= 7) return 'КРИТИЧЕСКОЕ';
    if (newsScore >= 5) return 'ТРЕБУЕТ ВНИМАНИЯ';
    return 'СТАБИЛЬНОЕ';
  };

  const getStatusColor = (newsScore) => {
    if (newsScore >= 7) return '#dc3545';
    if (newsScore >= 5) return '#ff9800';
    return '#28a745';
  };

  const renderItem = ({ item }) => {
    const status = getStatusFromNEWS(item.newsScore);

    return (
      <TouchableOpacity
        style={patientStyles.patientCard}
        onPress={() => navigation.navigate('PatientCard', {
          patient: {
            id: item.id,
            name: item.name,
            age: item.age,
            room: item.room,
            newsScore: item.newsScore,  // Передаем ТОЛЬКО newsScore
            diagnosis: item.diagnosis,
            hospitalizationId: item.hospitalizationId,
            doctorName: item.doctorName,
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
            <Text style={[{ marginBottom: 4, fontSize: 12, color: '#666', fontWeight: '600' }]}>NEWS</Text>
            <View
              style={{
                backgroundColor: getStatusColor(item.newsScore),
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

        <Text style={[
          patientStyles.patientStatus,
          {
            color: getStatusColor(item.newsScore),
            backgroundColor: `${getStatusColor(item.newsScore)}15`,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            fontSize: 11,
            fontWeight: '600',
            marginTop: 8,
            alignSelf: 'flex-start'
          }
        ]}>
          {getStatusText(item.newsScore)}
        </Text>
      </TouchableOpacity>
    );
  };

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
    <SafeScreen backgroundColor="#fff" barStyle="dark-content">

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
    </SafeScreen >
  );
}