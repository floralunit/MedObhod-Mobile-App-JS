import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

import { useUser } from '../context/UserContext';
import { globalStyles } from '../styles/globalStyles';
import { headDepartmentStyles } from '../styles/headDepartmentStyles';
import { 
  getDoctors, 
  getNurses, 
  addUser, 
  deleteUser, 
  updateUserRole,
  getUserStats,
  syncUsers 
} from '../services/userSyncService';

import AsyncStorage from '@react-native-async-storage/async-storage';


export default function HeadDepartmentScreen({ navigation, route }) {
  const { user } = useUser();
  const [selectedTab, setSelectedTab] = useState('doctors');
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [userStats, setUserStats] = useState({ doctors: 0, nurses: 0, total: 0 });
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    login: '',
    password: '',
    fullName: '',
    role: 'doctor',
  });

  // Статистика отделения
  const [stats, setStats] = useState({
    totalPatients: 0,
    criticalPatients: 0,
    pendingAppointments: 0,
    completedToday: 0,
  });

  // Загружаем данные с сервера при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Синхронизация с сервером
      await syncUsers();
      
      // Загружаем из локальной БД
      const doctorsList = await getDoctors();
      const nursesList = await getNurses();
      const statsUsers = getUserStats();
      
      setDoctors(doctorsList);
      setNurses(nursesList);
      setUserStats(statsUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const getDoctorStats = (doctorId, doctorName) => {
    return {
      patientsCount: Math.floor(Math.random() * 15) + 5,
      appointmentsCount: Math.floor(Math.random() * 30) + 10,
      criticalCount: Math.floor(Math.random() * 3),
    };
  };

  const handleAddUser = async () => {
    // Валидация
    const errors = [];
    if (!newDoctor.fullName.trim()) errors.push('ФИО');
    if (!newDoctor.login.trim()) errors.push('Логин');
    if (!newDoctor.password.trim()) errors.push('Пароль');
    
    if (errors.length > 0) {
      Alert.alert('Ошибка', `Заполните обязательные поля: ${errors.join(', ')}`);
      return;
    }
    
    if (newDoctor.password.length < 4) {
      Alert.alert('Ошибка', 'Пароль должен быть не менее 4 символов');
      return;
    }
    
    if (newDoctor.login.length < 3) {
      Alert.alert('Ошибка', 'Логин должен быть не менее 3 символов');
      return;
    }

    setAddingUser(true);
    
    try {
    // Проверяем токен перед отправкой
    const token = await AsyncStorage.getItem('accessToken');
    console.log('Current token before adding user:', token ? `${token.substring(0, 30)}...` : 'NO TOKEN');
    
    if (!token) {
      Alert.alert('Ошибка', 'Сессия истекла. Выйдите и зайдите заново.');
      return;
    }
    
    const userData = {
      login: newDoctor.login.trim(),
      password: newDoctor.password,
      fullName: newDoctor.fullName.trim(),
      role: newDoctor.role,
    };
      
      const newUser = await addUser(userData);
      
      Alert.alert('Успешно', `Пользователь ${newUser.fullName} добавлен`);
      setShowDoctorModal(false);
      
      // Сбрасываем форму
      setNewDoctor({
        login: '',
        password: '',
        fullName: '',
        role: 'doctor',
      });
      
      // Обновляем список
      await loadUsers();
    } catch (error) {
      console.error('Add user error:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось добавить пользователя');
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = (userItem) => {
    Alert.alert(
      'Удалить пользователя',
      `Вы действительно хотите удалить ${userItem.fullName}?\n\nПользователь больше не сможет войти в систему.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userItem.id);
              Alert.alert('Успешно', 'Пользователь удален');
              await loadUsers();
            } catch (error) {
              Alert.alert('Ошибка', error.message || 'Не удалось удалить пользователя');
            }
          }
        }
      ]
    );
  };

  const handleEditRole = (userItem) => {
    const newRole = userItem.role === 'doctor' ? 'nurse' : 'doctor';
    const roleName = newRole === 'doctor' ? 'Врача' : 'Медсестру';
    
    Alert.alert(
      'Изменить роль',
      `Изменить роль пользователя ${userItem.fullName} на "${roleName}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Изменить',
          onPress: async () => {
            try {
              await updateUserRole(userItem.id, newRole);
              Alert.alert('Успешно', `Роль пользователя изменена на ${roleName}`);
              await loadUsers();
            } catch (error) {
              Alert.alert('Ошибка', error.message || 'Не удалось изменить роль');
            }
          }
        }
      ]
    );
  };

  // Статистика отделения
  const renderStats = () => (
    <View style={headDepartmentStyles.statsContainer}>
      <Text style={headDepartmentStyles.sectionTitle}>Статистика отделения</Text>
      
      <View style={headDepartmentStyles.statsGrid}>
        <View style={headDepartmentStyles.statCard}>
          <Text style={headDepartmentStyles.statValue}>{stats.totalPatients || 42}</Text>
          <Text style={headDepartmentStyles.statLabel}>Всего пациентов</Text>
        </View>
        
        <View style={headDepartmentStyles.statCard}>
          <Text style={[headDepartmentStyles.statValue, { color: '#dc3545' }]}>
            {stats.criticalPatients || 5}
          </Text>
          <Text style={headDepartmentStyles.statLabel}>Критические</Text>
        </View>
        
        <View style={headDepartmentStyles.statCard}>
          <Text style={[headDepartmentStyles.statValue, { color: '#ff9800' }]}>
            {stats.pendingAppointments || 23}
          </Text>
          <Text style={headDepartmentStyles.statLabel}>Назначения</Text>
        </View>
        
        <View style={headDepartmentStyles.statCard}>
          <Text style={[headDepartmentStyles.statValue, { color: '#28a745' }]}>
            {stats.completedToday || 15}
          </Text>
          <Text style={headDepartmentStyles.statLabel}>Выполнено сегодня</Text>
        </View>
      </View>
    </View>
  );

  // Отчеты
  const renderReports = () => (
    <View style={headDepartmentStyles.reportsContainer}>
      <Text style={headDepartmentStyles.sectionTitle}>Отчеты</Text>
      
      <TouchableOpacity
        style={headDepartmentStyles.reportCard}
        onPress={() => Alert.alert('Отчет', 'Формирование ежедневного отчета...')}
      >
        <Text style={headDepartmentStyles.reportIcon}>📊</Text>
        <Text style={headDepartmentStyles.reportTitle}>Ежедневный отчет</Text>
        <Text style={headDepartmentStyles.reportDescription}>
          Обзор состояния отделения за сегодня
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={headDepartmentStyles.reportCard}
        onPress={() => Alert.alert('Отчет', 'Формирование недельного отчета...')}
      >
        <Text style={headDepartmentStyles.reportIcon}>📈</Text>
        <Text style={headDepartmentStyles.reportTitle}>Недельный отчет</Text>
        <Text style={headDepartmentStyles.reportDescription}>
          Динамика показателей за неделю
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={headDepartmentStyles.reportCard}
        onPress={() => Alert.alert('Отчет', 'Формирование отчета по врачам...')}
      >
        <Text style={headDepartmentStyles.reportIcon}>👨‍⚕️</Text>
        <Text style={headDepartmentStyles.reportTitle}>Отчет по врачам</Text>
        <Text style={headDepartmentStyles.reportDescription}>
          Эффективность работы врачей
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Визуализация врачей
  const renderDoctorsList = () => (
    <View style={headDepartmentStyles.listContainer}>
      <View style={headDepartmentStyles.listHeader}>
        <Text style={headDepartmentStyles.sectionTitle}>
          Врачи отделения ({userStats.doctors})
        </Text>
        <TouchableOpacity
          style={headDepartmentStyles.addButton}
          onPress={() => setShowDoctorModal(true)}
        >
          <Text style={headDepartmentStyles.addButtonText}>+ Добавить</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 20 }} />
      ) : (
        doctors.map((item) => {
          const doctorStats = getDoctorStats(item.id, item.fullName);
          
          return (
            <TouchableOpacity
              key={item.id}
              style={headDepartmentStyles.doctorCard}
              onPress={() => Alert.alert(
                item.fullName,
                `Логин: ${item.login}\nРоль: ${item.role === 'doctor' ? 'Врач' : 'Медсестра'}\n\nПациентов: ${doctorStats.patientsCount}\nНазначений: ${doctorStats.appointmentsCount}\nКритических: ${doctorStats.criticalCount}`
              )}
              activeOpacity={0.7}
            >
              <View style={headDepartmentStyles.doctorAvatar}>
                <Text style={headDepartmentStyles.doctorAvatarText}>
                  {item.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
              
              <View style={headDepartmentStyles.doctorInfo}>
                <Text style={headDepartmentStyles.doctorName}>{item.fullName}</Text>
                <Text style={headDepartmentStyles.doctorRole}>
                  {item.role === 'doctor' ? 'Врач' : 'Медсестра'}
                </Text>
                <Text style={headDepartmentStyles.doctorLogin}>{item.login}</Text>
              </View>
              
              <View style={headDepartmentStyles.doctorActions}>
                <TouchableOpacity
                  style={headDepartmentStyles.editButton}
                  onPress={() => handleEditRole(item)}
                >
                  <Text style={headDepartmentStyles.editButtonText}>✏️</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={headDepartmentStyles.deleteButton}
                  onPress={() => handleDeleteUser(item)}
                >
                  <Text style={headDepartmentStyles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })
      )}
      
      {doctors.length === 0 && !loading && (
        <View style={headDepartmentStyles.emptyState}>
          <Text style={headDepartmentStyles.emptyText}>Нет врачей</Text>
        </View>
      )}
    </View>
  );

  // Визуализация медсестер
  const renderNursesList = () => (
    <View style={headDepartmentStyles.listContainer}>
      <Text style={headDepartmentStyles.sectionTitle}>
        Медсестры отделения ({userStats.nurses})
      </Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 20 }} />
      ) : (
        nurses.map((item) => (
          <View key={item.id} style={headDepartmentStyles.nurseCard}>
            <View style={headDepartmentStyles.nurseAvatar}>
              <Text style={headDepartmentStyles.nurseAvatarText}>
                {item.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
            
            <View style={headDepartmentStyles.nurseInfo}>
              <Text style={headDepartmentStyles.nurseName}>{item.fullName}</Text>
              <Text style={headDepartmentStyles.nurseRole}>Медсестра</Text>
              <Text style={headDepartmentStyles.nurseLogin}>{item.login}</Text>
            </View>
            
            <View style={headDepartmentStyles.nurseActions}>
              <TouchableOpacity
                style={headDepartmentStyles.editButton}
                onPress={() => handleEditRole(item)}
              >
                <Text style={headDepartmentStyles.editButtonText}>✏️</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={headDepartmentStyles.deleteButton}
                onPress={() => handleDeleteUser(item)}
              >
                <Text style={headDepartmentStyles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
      
      {nurses.length === 0 && !loading && (
        <View style={headDepartmentStyles.emptyState}>
          <Text style={headDepartmentStyles.emptyText}>Нет медсестер</Text>
        </View>
      )}
    </View>
  );

  // Модальное окно добавления пользователя
  const renderUserModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showDoctorModal}
      onRequestClose={() => setShowDoctorModal(false)}
    >
      <View style={headDepartmentStyles.modalOverlay}>
        <View style={headDepartmentStyles.modalContent}>
          <View style={headDepartmentStyles.modalHeader}>
            <Text style={headDepartmentStyles.modalTitle}>Добавить сотрудника</Text>
            <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
              <Text style={headDepartmentStyles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={headDepartmentStyles.modalInput}
            placeholder="ФИО *"
            placeholderTextColor="#999"
            value={newDoctor.fullName}
            onChangeText={text => setNewDoctor({...newDoctor, fullName: text})}
          />
          
          <TextInput
            style={headDepartmentStyles.modalInput}
            placeholder="Логин *"
            placeholderTextColor="#999"
            value={newDoctor.login}
            onChangeText={text => setNewDoctor({...newDoctor, login: text})}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TextInput
            style={headDepartmentStyles.modalInput}
            placeholder="Пароль *"
            placeholderTextColor="#999"
            value={newDoctor.password}
            onChangeText={text => setNewDoctor({...newDoctor, password: text})}
            secureTextEntry
          />
          
<View style={headDepartmentStyles.pickerWrapper}>
  <Text style={headDepartmentStyles.modalLabel}>Роль:</Text>
  <Picker
    selectedValue={newDoctor.role}
    onValueChange={(value) => setNewDoctor({...newDoctor, role: value})}
    style={headDepartmentStyles.picker}
  >
    <Picker.Item label="👨‍⚕️ Врач" value="doctor" />
    <Picker.Item label="👩‍⚕️ Медсестра" value="nurse" />
  </Picker>
</View>
          
          <View style={headDepartmentStyles.modalButtons}>
            <TouchableOpacity
              style={[headDepartmentStyles.modalButton, headDepartmentStyles.modalCancelButton]}
              onPress={() => setShowDoctorModal(false)}
            >
              <Text style={headDepartmentStyles.modalCancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[headDepartmentStyles.modalButton, headDepartmentStyles.modalSaveButton]}
              onPress={handleAddUser}
              disabled={addingUser}
            >
              {addingUser ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={headDepartmentStyles.modalSaveButtonText}>Добавить</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={headDepartmentStyles.header}>
        <Text style={globalStyles.title}>Управление отделением</Text>
        <Text style={headDepartmentStyles.subtitle}>Заведующий отделением</Text>
      </View>

      {/* Вкладки */}
      <View style={headDepartmentStyles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              headDepartmentStyles.tabButton,
              selectedTab === 'doctors' && headDepartmentStyles.tabButtonActive
            ]}
            onPress={() => setSelectedTab('doctors')}
          >
            <Text style={[
              headDepartmentStyles.tabButtonText,
              selectedTab === 'doctors' && headDepartmentStyles.tabButtonTextActive
            ]}>Сотрудники</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              headDepartmentStyles.tabButton,
              selectedTab === 'analytics' && headDepartmentStyles.tabButtonActive
            ]}
            onPress={() => setSelectedTab('analytics')}
          >
            <Text style={[
              headDepartmentStyles.tabButtonText,
              selectedTab === 'analytics' && headDepartmentStyles.tabButtonTextActive
            ]}>Аналитика</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              headDepartmentStyles.tabButton,
              selectedTab === 'reports' && headDepartmentStyles.tabButtonActive
            ]}
            onPress={() => setSelectedTab('reports')}
          >
            <Text style={[
              headDepartmentStyles.tabButtonText,
              selectedTab === 'reports' && headDepartmentStyles.tabButtonTextActive
            ]}>Отчеты</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView 
        style={headDepartmentStyles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'doctors' && (
          <>
            {renderDoctorsList()}
            {renderNursesList()}
          </>
        )}
        {selectedTab === 'analytics' && renderStats()}
        {selectedTab === 'reports' && renderReports()}
      </ScrollView>

      {renderUserModal()}
    </SafeAreaView>
  );
}