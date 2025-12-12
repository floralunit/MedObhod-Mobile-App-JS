import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { patients } from '../data/patients';
import { homeStyles } from '../styles/homeStyles';

export default function HomeScreen({ navigation, route }) {
  //const { role, name } = route.params;
  const role = "nurse";
  const name = "Петрова Анна Сергеевна";
  const userName = name.split(' ')[0];
  
  // Получаем инициалы для аватара
  const getInitials = (fullName) => {
    return fullName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Получаем количество пациентов по статусам
  const getPatientStats = () => {
    const critical = patients.filter(p => p.status === 'critical').length;
    const warning = patients.filter(p => p.status === 'warning').length;
    const stable = patients.filter(p => p.status === 'stable').length;
    return { critical, warning, stable, total: patients.length };
  };

  const patientStats = getPatientStats();

  // Получаем цвет статуса
  const getStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return '#dc3545';
      case 'warning':
        return '#ff9800';
      case 'stable':
        return '#28a745';
      default:
        return '#64748b';
    }
  };

  // Получаем текст статуса
  const getStatusText = (status) => {
    switch (status) {
      case 'critical':
        return 'Критическое';
      case 'warning':
        return 'Требует внимания';
      case 'stable':
        return 'Стабильное';
      default:
        return status;
    }
  };

  // Текущие задачи для врача
  const doctorTasks = [
    {
      id: 1,
      title: 'Утренний обход',
      time: '09:00',
      status: 'pending',
      icon: '👨‍⚕️',
    },
    {
      id: 2,
      title: 'Консультация пациента из 203',
      time: '10:30',
      status: 'pending',
      icon: '💬',
    },
    {
      id: 3,
      title: 'Заполнение документации',
      time: '14:00',
      status: 'pending',
      icon: '📋',
    },
    {
      id: 4,
      title: 'Встреча с заведующим',
      time: '16:00',
      status: 'pending',
      icon: '👥',
    },
  ];

  // Текущие задачи для медсестры
  const nurseTasks = [
    {
      id: 1,
      title: 'Измерение показателей',
      time: '08:00',
      status: 'pending',
      icon: '🌡️',
    },
    {
      id: 2,
      title: 'Раздача лекарств',
      time: '09:30',
      status: 'pending',
      icon: '💊',
    },
    {
      id: 3,
      title: 'Подготовка процедур',
      time: '11:00',
      status: 'pending',
      icon: '🩺',
    },
    {
      id: 4,
      title: 'Ведение журнала',
      time: '15:00',
      status: 'pending',
      icon: '📝',
    },
  ];

  // Текущие задачи для заведующего
  const headTasks = [
    {
      id: 1,
      title: 'Планерка отделения',
      time: '08:30',
      status: 'pending',
      icon: '📊',
    },
    {
      id: 2,
      title: 'Распределение нагрузки',
      time: '11:00',
      status: 'pending',
      icon: '👥',
    },
    {
      id: 3,
      title: 'Аналитика за неделю',
      time: '13:00',
      status: 'pending',
      icon: '📈',
    },
    {
      id: 4,
      title: 'Совещание с врачами',
      time: '15:30',
      status: 'pending',
      icon: '💼',
    },
  ];

  const tasks = role === 'doctor' ? doctorTasks : role === 'nurse' ? nurseTasks : headTasks;

  // Быстрые действия в зависимости от роли
  const getQuickActions = () => {
    const baseActions = [
      {
        id: 'patients',
        title: 'Пациенты',
        description: 'Просмотр всех пациентов отделения',
        icon: '👥',
        iconColor: '#007aff',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        onPress: () => navigation.navigate('Patients'),
      },
    ];

    if (role === 'doctor') {
      return [
        ...baseActions,
        {
          id: 'round',
          title: 'Начать обход',
          description: 'Оптимальный маршрут по палатам',
          icon: '🚶‍♂️',
          iconColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          onPress: () => navigation.navigate('NurseRoute'),
        },
        {
          id: 'appointments',
          title: 'Назначения',
          description: 'Создание и просмотр назначений',
          icon: '💊',
          iconColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          onPress: () => console.log('Appointments'),
        },
        {
          id: 'notes',
          title: 'Заметки',
          description: 'Быстрые заметки и осмотры',
          icon: '📝',
          iconColor: '#9c27b0',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          onPress: () => console.log('Notes'),
        },
      ];
    } else if (role === 'nurse') {
      return [
        ...baseActions,
                {
          id: 'round',
          title: 'Начать обход',
          description: 'Оптимальный маршрут по палатам',
          icon: '🚶‍♂️',
          iconColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          onPress: () => navigation.navigate('NurseRoute'),
        },
        {
          id: 'medications',
          title: 'Лекарства',
          description: 'Учет и выдача лекарств',
          icon: '💊',
          iconColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          onPress: () => console.log('Medications'),
        },
        {
          id: 'procedures',
          title: 'Процедуры',
          description: 'План процедур на день',
          icon: '🩺',
          iconColor: '#17a2b8',
          backgroundColor: 'rgba(23, 162, 184, 0.1)',
          onPress: () => console.log('Procedures'),
        },
        {
          id: 'vitals',
          title: 'Показатели',
          description: 'Внесение витальных показателей',
          icon: '🌡️',
          iconColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          onPress: () => console.log('Vitals'),
        },
      ];
    } else {
      return [
        ...baseActions,
        {
          id: 'analytics',
          title: 'Аналитика',
          description: 'Статистика и показатели отделения',
          icon: '📊',
          iconColor: '#6f42c1',
          backgroundColor: 'rgba(111, 66, 193, 0.1)',
          onPress: () => console.log('Analytics'),
        },
        {
          id: 'staff',
          title: 'Сотрудники',
          description: 'Управление персоналом отделения',
          icon: '👨‍⚕️',
          iconColor: '#fd7e14',
          backgroundColor: 'rgba(253, 126, 20, 0.1)',
          onPress: () => console.log('Staff'),
        },
        {
          id: 'reports',
          title: 'Отчеты',
          description: 'Формирование отчетности',
          icon: '📋',
          iconColor: '#20c997',
          backgroundColor: 'rgba(32, 201, 151, 0.1)',
          onPress: () => console.log('Reports'),
        },
      ];
    }
  };

  const quickActions = getQuickActions();

  // Пациенты, требующие внимания
  const criticalPatients = patients
    .filter(p => p.status === 'critical' || p.status === 'warning')
    .slice(0, 3);

  const renderHeader = () => (
    <View style={homeStyles.header}>
      <View style={homeStyles.headerContent}>
        <View style={homeStyles.userInfo}>
          <Text style={homeStyles.welcomeText}>Добро пожаловать,</Text>
          <Text style={homeStyles.userName}>{userName}</Text>
          <View style={homeStyles.userRoleContainer}>
            <Text style={homeStyles.userRole}>
              {role === 'doctor' ? 'Врач' : role === 'nurse' ? 'Медсестра' : 'Заведующий отделением'}
            </Text>
          </View>
        </View>
        <View style={homeStyles.userAvatar}>
          <Text style={homeStyles.userAvatarText}>{getInitials(name)}</Text>
        </View>
      </View>

      <View style={homeStyles.statsContainer}>
        <View style={homeStyles.statCard}>
          <Text style={homeStyles.statValue}>{patientStats.total}</Text>
          <Text style={homeStyles.statLabel}>Всего пациентов</Text>
        </View>
        <View style={homeStyles.statCard}>
          <Text style={[homeStyles.statValue, { color: '#dc3545' }]}>{patientStats.critical}</Text>
          <Text style={homeStyles.statLabel}>Критическое состояние</Text>
        </View>
        <View style={homeStyles.statCard}>
          <Text style={[homeStyles.statValue, { color: '#ff9800' }]}>{patientStats.warning}</Text>
          <Text style={homeStyles.statLabel}>Требует внимания</Text>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View>
      <Text style={homeStyles.sectionTitle}>Быстрые действия</Text>
      <View style={homeStyles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={homeStyles.actionCard}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={[homeStyles.actionIconContainer, { backgroundColor: action.backgroundColor }]}>
              <Text style={[homeStyles.actionIcon, { color: action.iconColor }]}>{action.icon}</Text>
            </View>
            <Text style={homeStyles.actionTitle}>{action.title}</Text>
            <Text style={homeStyles.actionDescription}>{action.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCriticalPatients = () => (
    <View style={homeStyles.patientsSection}>
      <View style={homeStyles.patientsHeader}>
        <Text style={homeStyles.sectionTitle}>Пациенты, требующие внимания</Text>
        <TouchableOpacity
          style={homeStyles.seeAllButton}
          onPress={() => navigation.navigate('Patients')}
        >
          <Text style={homeStyles.seeAllText}>Все пациенты →</Text>
        </TouchableOpacity>
      </View>

      {criticalPatients.length > 0 ? (
        criticalPatients.map((patient) => (
          <TouchableOpacity
            key={patient.id}
            style={homeStyles.patientCard}
            onPress={() => navigation.navigate('PatientCard', { patient })}
            activeOpacity={0.7}
          >
            <View style={homeStyles.patientAvatar}>
              <Text style={homeStyles.patientAvatarText}>
                {patient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
            <View style={homeStyles.patientInfo}>
              <Text style={homeStyles.patientName} numberOfLines={1}>
                {patient.name}
              </Text>
              <Text style={homeStyles.patientDetails}>
                Палата {patient.room} • {patient.age} лет • NEWS: {patient.newsScore}
              </Text>
              <View style={homeStyles.patientStatus}>
                <View
                  style={[
                    homeStyles.statusDot,
                    { backgroundColor: getStatusColor(patient.status) },
                  ]}
                />
                <Text style={[homeStyles.statusText, { color: getStatusColor(patient.status) }]}>
                  {getStatusText(patient.status)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={homeStyles.emptyState}>
          <Text style={homeStyles.emptyIcon}>👨‍⚕️</Text>
          <Text style={homeStyles.emptyText}>Нет пациентов, требующих внимания</Text>
        </View>
      )}
    </View>
  );

  const renderUpcomingTasks = () => (
    <View style={homeStyles.upcomingTasks}>
      <Text style={homeStyles.sectionTitle}>Предстоящие задачи</Text>
      
      {tasks.map((task) => (
        <View key={task.id} style={homeStyles.taskCard}>
          <View style={homeStyles.taskIconContainer}>
            <Text style={homeStyles.taskIcon}>{task.icon}</Text>
          </View>
          <View style={homeStyles.taskInfo}>
            <Text style={homeStyles.taskTitle}>{task.title}</Text>
            <Text style={homeStyles.taskTime}>{task.time}</Text>
          </View>
          <View
            style={[
              homeStyles.taskStatus,
              {
                backgroundColor: task.status === 'pending' ? '#fff3cd' : '#d4edda',
              },
            ]}
          >
            <Text
              style={[
                homeStyles.taskStatusText,
                {
                  color: task.status === 'pending' ? '#856404' : '#155724',
                },
              ]}
            >
              {task.status === 'pending' ? 'Ожидает' : 'Выполнено'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderFooter = () => (
    <View style={homeStyles.footer}>
      <View style={homeStyles.appInfo}>
        <Text style={homeStyles.appName}>МедОбход+</Text>
        <Text style={homeStyles.appVersion}>Версия 1.0.0</Text>
        <Text style={[homeStyles.appVersion, { marginTop: 8 }]}>
          Интеллектуальная система обхода палат
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={homeStyles.safeArea}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#007aff" 
        translucent={Platform.OS === 'android'}
      />
      
      <ScrollView 
        style={homeStyles.container}
        contentContainerStyle={homeStyles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        
        <View style={homeStyles.mainContent}>
          {renderQuickActions()}
          {renderCriticalPatients()}
          {renderUpcomingTasks()}
        </View>
        
        {renderFooter()}
      </ScrollView>
    </SafeAreaView>
  );
}