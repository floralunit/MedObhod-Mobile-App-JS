import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { users } from '../data/users';
import { patients } from '../data/patients';
import { allAppointments } from '../data/appointments';
import { globalStyles } from '../styles/globalStyles';
import { headDepartmentStyles } from '../styles/headDepartmentStyles';

export default function HeadDepartmentScreen({ navigation, route }) { // Добавьте route в параметры
  const [selectedTab, setSelectedTab] = useState('doctors');
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    criticalPatients: 0,
    pendingAppointments: 0,
    completedToday: 0,
  });
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    login: '',
    password: '',
    name: '',
    specialty: '',
  });

  // Обрабатываем параметры навигации
  useEffect(() => {
    if (route.params?.initialTab) {
      setSelectedTab(route.params.initialTab);
    }
  }, [route.params]);

  // Загружаем данные при монтировании
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const doctorsList = users.filter(user => user.role === 'doctor');
    const nursesList = users.filter(user => user.role === 'nurse');
    
    setDoctors(doctorsList);
    setNurses(nursesList);

    const totalPatients = patients.length;
    const criticalPatients = patients.filter(p => p.status === 'critical').length;
    const pendingAppointments = allAppointments.filter(a => a.status === 'pending').length;
    const completedToday = Math.floor(Math.random() * 10) + 5;

    setStats({
      totalPatients,
      criticalPatients,
      pendingAppointments,
      completedToday,
    });
  };

  const getDoctorStats = (doctorName) => {
    const doctorPatients = patients.filter(p => {
      return (p.id % 2 === 0 && doctorName.includes('Иванов')) ||
             (p.id % 2 !== 0 && doctorName.includes('Петров'));
    });
    
    const appointments = allAppointments.filter(app => 
      app.createdBy === doctorName.toLowerCase().replace(/\s/g, '')
    );

    return {
      patientsCount: doctorPatients.length,
      appointmentsCount: appointments.length,
      criticalCount: doctorPatients.filter(p => p.status === 'critical').length,
    };
  };

  // Статистика
  const renderStats = () => (
    <View style={headDepartmentStyles.statsContainer}>
      <Text style={headDepartmentStyles.sectionTitle}>Статистика отделения</Text>
      
      <View style={headDepartmentStyles.statsGrid}>
        <View style={headDepartmentStyles.statCard}>
          <Text style={headDepartmentStyles.statValue}>{stats.totalPatients}</Text>
          <Text style={headDepartmentStyles.statLabel}>Всего пациентов</Text>
        </View>
        
        <View style={headDepartmentStyles.statCard}>
          <Text style={[headDepartmentStyles.statValue, { color: '#dc3545' }]}>
            {stats.criticalPatients}
          </Text>
          <Text style={headDepartmentStyles.statLabel}>Критические</Text>
        </View>
        
        <View style={headDepartmentStyles.statCard}>
          <Text style={[headDepartmentStyles.statValue, { color: '#ff9800' }]}>
            {stats.pendingAppointments}
          </Text>
          <Text style={headDepartmentStyles.statLabel}>Назначения</Text>
        </View>
        
        <View style={headDepartmentStyles.statCard}>
          <Text style={[headDepartmentStyles.statValue, { color: '#28a745' }]}>
            {stats.completedToday}
          </Text>
          <Text style={headDepartmentStyles.statLabel}>Выполнено сегодня</Text>
        </View>
      </View>
    </View>
  );

  // Врачи
  const renderDoctorsList = () => (
    <View style={headDepartmentStyles.listContainer}>
      <View style={headDepartmentStyles.listHeader}>
        <Text style={headDepartmentStyles.sectionTitle}>Врачи отделения</Text>
        <TouchableOpacity
          style={headDepartmentStyles.addButton}
          onPress={() => setShowDoctorModal(true)}
        >
          <Text style={headDepartmentStyles.addButtonText}>+ Добавить</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 20 }}>
        {doctors.map((item) => {
          const doctorStats = getDoctorStats(item.name);
          
          return (
            <TouchableOpacity
              key={item.login}
              style={headDepartmentStyles.doctorCard}
              onPress={() => Alert.alert(
                item.name,
                `Логин: ${item.login}\n\nПациентов: ${doctorStats.patientsCount}\nНазначений: ${doctorStats.appointmentsCount}\nКритических: ${doctorStats.criticalCount}`
              )}
              activeOpacity={0.7}
            >
              <View style={headDepartmentStyles.doctorAvatar}>
                <Text style={headDepartmentStyles.doctorAvatarText}>
                  {item.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
              
              <View style={headDepartmentStyles.doctorInfo}>
                <Text style={headDepartmentStyles.doctorName}>{item.name}</Text>
                <Text style={headDepartmentStyles.doctorRole}>Врач-терапевт</Text>
                
                <View style={headDepartmentStyles.doctorStats}>
                  <View style={headDepartmentStyles.statMini}>
                    <Text style={headDepartmentStyles.statMiniValue}>{doctorStats.patientsCount}</Text>
                    <Text style={headDepartmentStyles.statMiniLabel}>пац.</Text>
                  </View>
                  
                  <View style={headDepartmentStyles.statMini}>
                    <Text style={[headDepartmentStyles.statMiniValue, { color: '#ff9800' }]}>
                      {doctorStats.appointmentsCount}
                    </Text>
                    <Text style={headDepartmentStyles.statMiniLabel}>назнач.</Text>
                  </View>
                  
                  <View style={headDepartmentStyles.statMini}>
                    <Text style={[headDepartmentStyles.statMiniValue, { color: '#dc3545' }]}>
                      {doctorStats.criticalCount}
                    </Text>
                    <Text style={headDepartmentStyles.statMiniLabel}>крит.</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                style={headDepartmentStyles.doctorActionButton}
                onPress={() => Alert.alert(
                  'Действия с врачом',
                  'Выберите действие:',
                  [
                    { text: 'Назначить пациента', onPress: () => assignPatientToDoctor(item) },
                    { text: 'Посмотреть график', onPress: () => viewDoctorSchedule(item) },
                    { text: 'Редактировать', onPress: () => editDoctor(item) },
                    { text: 'Отмена', style: 'cancel' },
                  ]
                )}
              >
                <Text style={headDepartmentStyles.doctorActionButtonText}>⋮</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Медсестры
  const renderNursesList = () => (
    <View style={headDepartmentStyles.listContainer}>
      <Text style={headDepartmentStyles.sectionTitle}>Медсестры отделения</Text>
      
      <View style={{ marginBottom: 20 }}>
        {nurses.map((item) => (
          <View key={item.login} style={headDepartmentStyles.nurseCard}>
            <View style={headDepartmentStyles.nurseAvatar}>
              <Text style={headDepartmentStyles.nurseAvatarText}>
                {item.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
            
            <View style={headDepartmentStyles.nurseInfo}>
              <Text style={headDepartmentStyles.nurseName}>{item.name}</Text>
              <Text style={headDepartmentStyles.nurseRole}>Медсестра</Text>
            </View>
            
            <TouchableOpacity
              style={headDepartmentStyles.nurseStatusBadge}
              onPress={() => Alert.alert(
                'Статус дежурства',
                'Изменить статус дежурства:',
                [
                  { text: 'На смене', onPress: () => console.log('На смене') },
                  { text: 'Выходной', onPress: () => console.log('Выходной') },
                  { text: 'Больничный', onPress: () => console.log('Больничный') },
                  { text: 'Отмена', style: 'cancel' },
                ]
              )}
            >
              <Text style={headDepartmentStyles.nurseStatusText}>На смене</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  // Отчеты
  const renderReports = () => (
    <View style={headDepartmentStyles.reportsContainer}>
      <Text style={headDepartmentStyles.sectionTitle}>Отчеты</Text>
      
      <TouchableOpacity
        style={headDepartmentStyles.reportCard}
        onPress={() => generateDailyReport()}
      >
        <Text style={headDepartmentStyles.reportIcon}>📊</Text>
        <Text style={headDepartmentStyles.reportTitle}>Ежедневный отчет</Text>
        <Text style={headDepartmentStyles.reportDescription}>
          Обзор состояния отделения за сегодня
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={headDepartmentStyles.reportCard}
        onPress={() => generateWeeklyReport()}
      >
        <Text style={headDepartmentStyles.reportIcon}>📈</Text>
        <Text style={headDepartmentStyles.reportTitle}>Недельный отчет</Text>
        <Text style={headDepartmentStyles.reportDescription}>
          Динамика показателей за неделю
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={headDepartmentStyles.reportCard}
        onPress={() => generateDoctorReport()}
      >
        <Text style={headDepartmentStyles.reportIcon}>👨‍⚕️</Text>
        <Text style={headDepartmentStyles.reportTitle}>Отчет по врачам</Text>
        <Text style={headDepartmentStyles.reportDescription}>
          Эффективность работы врачей
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={headDepartmentStyles.reportCard}
        onPress={() => generateQualityReport()}
      >
        <Text style={headDepartmentStyles.reportIcon}>⭐</Text>
        <Text style={headDepartmentStyles.reportTitle}>Качество лечения</Text>
        <Text style={headDepartmentStyles.reportDescription}>
          Анализ качества медицинской помощи
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Вспомогательные функции
  const assignPatientToDoctor = (doctor) => {
    Alert.alert(
      'Назначить пациента',
      'Выберите пациента для назначения врачу:',
      patients.slice(0, 5).map(patient => ({
        text: `${patient.name} (пал. ${patient.room})`,
        onPress: () => {
          Alert.alert(
            'Успешно',
            `Пациент ${patient.name} назначен врачу ${doctor.name}`
          );
        }
      })).concat([{ text: 'Отмена', style: 'cancel' }])
    );
  };

  const viewDoctorSchedule = (doctor) => {
    Alert.alert(
      `Расписание врача ${doctor.name}`,
      'Понедельник: 8:00-15:00\nВторник: 8:00-15:00\nСреда: 8:00-15:00\nЧетверг: 8:00-15:00\nПятница: 8:00-15:00\nСуббота: дежурство\nВоскресенье: выходной'
    );
  };

  const editDoctor = (doctor) => {
    setNewDoctor({
      login: doctor.login,
      password: '',
      name: doctor.name,
      specialty: 'Врач-терапевт',
    });
    setShowDoctorModal(true);
  };

  const generateDailyReport = () => {
    Alert.alert(
      'Ежедневный отчет сгенерирован',
      `Отчет за ${new Date().toLocaleDateString('ru-RU')}\n\n` +
      `• Пациентов: ${stats.totalPatients}\n` +
      `• Критических: ${stats.criticalPatients}\n` +
      `• Новых поступлений: 2\n` +
      `• Выписок: 1\n` +
      `• Выполнено назначений: ${stats.completedToday}\n\n` +
      `Отчет сохранен в архиве.`
    );
  };

  const generateWeeklyReport = () => {
    Alert.alert('Недельный отчет', 'Формирование отчета...');
  };

  const generateDoctorReport = () => {
    Alert.alert('Отчет по врачам', 'Формирование отчета...');
  };

  const generateQualityReport = () => {
    Alert.alert('Отчет по качеству', 'Формирование отчета...');
  };

  const handleAddDoctor = () => {
    if (!newDoctor.login || !newDoctor.name) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }

    Alert.alert('Успешно', `Врач ${newDoctor.name} добавлен в систему`);
    setShowDoctorModal(false);
    setNewDoctor({ login: '', password: '', name: '', specialty: '' });
  };

  // Модальное окно
  const renderDoctorModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showDoctorModal}
      onRequestClose={() => setShowDoctorModal(false)}
    >
      <View style={headDepartmentStyles.modalOverlay}>
        <View style={headDepartmentStyles.modalContent}>
          <Text style={headDepartmentStyles.modalTitle}>
            {newDoctor.login ? 'Редактировать врача' : 'Добавить врача'}
          </Text>
          
          <TextInput
            style={headDepartmentStyles.modalInput}
            placeholder="ФИО врача"
            value={newDoctor.name}
            onChangeText={text => setNewDoctor({...newDoctor, name: text})}
          />
          
          <TextInput
            style={headDepartmentStyles.modalInput}
            placeholder="Логин"
            value={newDoctor.login}
            onChangeText={text => setNewDoctor({...newDoctor, login: text})}
            autoCapitalize="none"
          />
          
          <TextInput
            style={headDepartmentStyles.modalInput}
            placeholder="Пароль"
            value={newDoctor.password}
            onChangeText={text => setNewDoctor({...newDoctor, password: text})}
            secureTextEntry
          />
          
          <TextInput
            style={headDepartmentStyles.modalInput}
            placeholder="Специальность"
            value={newDoctor.specialty}
            onChangeText={text => setNewDoctor({...newDoctor, specialty: text})}
          />
          
          <View style={headDepartmentStyles.modalButtons}>
            <TouchableOpacity
              style={[headDepartmentStyles.modalButton, headDepartmentStyles.modalCancelButton]}
              onPress={() => setShowDoctorModal(false)}
            >
              <Text style={headDepartmentStyles.modalCancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[headDepartmentStyles.modalButton, headDepartmentStyles.modalSaveButton]}
              onPress={handleAddDoctor}
            >
              <Text style={headDepartmentStyles.modalSaveButtonText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Контент для каждой вкладки
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'doctors':
        return (
          <>
            {renderDoctorsList()}
            {renderNursesList()}
          </>
        );
      case 'analytics':
        return (
          <>
            {renderStats()}
            
            <View style={headDepartmentStyles.analyticsContainer}>
              <Text style={headDepartmentStyles.sectionTitle}>Ключевые показатели</Text>
              
              <View style={headDepartmentStyles.kpiCard}>
                <Text style={headDepartmentStyles.kpiTitle}>Средняя длительность госпитализации</Text>
                <Text style={headDepartmentStyles.kpiValue}>5.2 дня</Text>
                <Text style={headDepartmentStyles.kpiTrend}>↓ 0.3 дня за месяц</Text>
              </View>
              
              <View style={headDepartmentStyles.kpiCard}>
                <Text style={headDepartmentStyles.kpiTitle}>Коэффициент занятости коек</Text>
                <Text style={headDepartmentStyles.kpiValue}>92%</Text>
                <Text style={headDepartmentStyles.kpiTrend}>↑ 3% за неделю</Text>
              </View>
              
              <View style={headDepartmentStyles.kpiCard}>
                <Text style={headDepartmentStyles.kpiTitle}>Удовлетворенность пациентов</Text>
                <Text style={headDepartmentStyles.kpiValue}>4.7 / 5</Text>
                <Text style={headDepartmentStyles.kpiTrend}>→ стабильно</Text>
              </View>
            </View>
          </>
        );
      case 'reports':
        return renderReports();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Заголовок */}
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
            ]}>Врачи и медсестры</Text>
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

      {/* Контент в зависимости от выбранной вкладки */}
      <ScrollView 
        style={headDepartmentStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>

      {/* Кнопка быстрого доступа */}
      <TouchableOpacity
        style={headDepartmentStyles.quickActionButton}
        onPress={() => navigation.navigate('Patients')}
      >
        <Text style={headDepartmentStyles.quickActionText}>👥 Пациенты отделения</Text>
      </TouchableOpacity>

      {renderDoctorModal()}
    </SafeAreaView>
  );
}