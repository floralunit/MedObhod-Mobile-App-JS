import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patients } from '../data/patients';
import { allAppointments } from '../data/appointments'; // Импортируем напрямую
import { homeStyles } from '../styles/homeStyles';
import { useUser } from '../context/UserContext';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useUser();
  const userRole = user?.role || 'nurse';
  const userName = user?.name || 'Петрова Анна Сергеевна';
  const firstName = userName.split(' ')[1] || userName.split(' ')[0];

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

  // УПРОЩЕННАЯ функция для получения статистики назначений
  const getNurseAppointmentsStats = () => {
    const pendingAppointments = allAppointments.filter(a => a.status === 'pending');
    
    // Фильтруем ближайшие назначения (на сегодня)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const todaysAppointments = pendingAppointments.filter(apt => {
      if (!apt.nextDue) return true;
      const dueDate = apt.nextDue.split('T')[0];
      return dueDate === todayStr;
    });
    
    const upcomingAppointments = pendingAppointments.filter(apt => {
      if (!apt.nextDue) return false;
      const dueTime = new Date(apt.nextDue);
      const timeDiff = (dueTime - now) / (1000 * 60 * 60); // Разница в часах
      return timeDiff <= 4 && timeDiff >= 0; // В ближайшие 4 часа
    });
    
    const urgentAppointments = pendingAppointments.filter(apt => apt.priority === 'high');
    
    return {
      total: pendingAppointments.length,
      upcoming: upcomingAppointments.length,
      urgent: urgentAppointments.length,
      todays: todaysAppointments.length
    };
  };

  const appointmentStats = userRole === 'nurse' ? getNurseAppointmentsStats() : null;

  // Получаем ближайшие назначения для медсестры
  const getUpcomingAppointments = () => {
    if (userRole !== 'nurse') return [];
    
    const pendingAppointments = allAppointments.filter(a => a.status === 'pending');
    const now = new Date();
    
    return pendingAppointments
      .filter(apt => {
        if (!apt.nextDue) return true;
        const dueTime = new Date(apt.nextDue);
        const timeDiff = (dueTime - now) / (1000 * 60 * 60); // Разница в часах
        return timeDiff <= 4 && timeDiff >= 0; // В ближайшие 4 часа
      })
      .sort((a, b) => {
        if (!a.nextDue && b.nextDue) return 1;
        if (a.nextDue && !b.nextDue) return -1;
        if (!a.nextDue && !b.nextDue) return 0;
        return new Date(a.nextDue) - new Date(b.nextDue);
      })
      .slice(0, 3); // Только 3 ближайших
  };

  const upcomingAppointments = getUpcomingAppointments();

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

  // Получаем текст роли
  const getRoleText = (role) => {
    switch (role) {
      case 'doctor':
        return 'Врач';
      case 'nurse':
        return 'Медсестра';
      case 'head':
        return 'Заведующий отделением';
      default:
        return 'Пользователь';
    }
  };

  // Текущие задачи для врача
  const doctorTasks = [
    {
      id: 1,
      title: 'Утренний обход отделения',
      time: '09:00',
      status: 'pending',
      icon: '👨‍⚕️',
      description: 'Проверка состояния пациентов, корректировка назначений',
    },
    {
      id: 2,
      title: 'Осмотр пациента Иванов И.И. (пал. 203)',
      time: '10:30',
      status: 'pending',
      icon: '💬',
      description: 'Оценка динамики пневмонии, возможная коррекция антибиотикотерапии',
    },
    {
      id: 3,
      title: 'Заполнение медицинской документации',
      time: '14:00',
      status: 'pending',
      icon: '📋',
      description: 'Внесение данных осмотров, назначений в электронные карты',
    },
    {
      id: 4,
      title: 'Консилиум по пациенту Петрова А.С.',
      time: '16:00',
      status: 'pending',
      icon: '👥',
      description: 'Совещание с кардиологом по тактике ведения',
    },
    {
      id: 5,
      title: 'Вечерний обход',
      time: '19:00',
      status: 'pending',
      icon: '🚶‍♂️',
      description: 'Контроль состояния пациентов, проверка выполнения назначений',
    },
  ];

  // Текущие задачи для медсестры
  const nurseTasks = [
    {
      id: 1,
      title: 'Измерение утренних показателей',
      time: '08:00',
      status: 'pending',
      icon: '🌡️',
      description: 'Температура, АД, пульс, сатурация у всех пациентов',
    },
    {
      id: 2,
      title: 'Раздача утренних лекарств',
      time: '08:30',
      status: 'pending',
      icon: '💊',
      description: 'Выдача препаратов по графику (Амоксиклав, Метопролол, Омепразол)',
    },
    {
      id: 3,
      title: 'Выполнение инъекций',
      time: '09:00',
      status: 'pending',
      icon: '💉',
      description: 'Цефтриаксон в/м пациенту Иванов И.И.',
    },
    {
      id: 4,
      title: 'Постановка капельниц',
      time: '10:00',
      status: 'pending',
      icon: '🩺',
      description: 'Натрия хлорид пациенту Иванов И.И., Фуросемид пациенту Петрова А.С.',
    },
    {
      id: 5,
      title: 'Перевязка пациента',
      time: '11:00',
      status: 'pending',
      icon: '🩹',
      description: 'Послеоперационная перевязка пациенту Сидоров А.П.',
    },
    {
      id: 6,
      title: 'Ведение журнала назначений',
      time: '15:00',
      status: 'pending',
      icon: '📝',
      description: 'Отметка выполненных назначений, внесение показателей',
    },
    {
      id: 7,
      title: 'Вечерние измерения',
      time: '20:00',
      status: 'pending',
      icon: '🌡️',
      description: 'Контроль показателей у пациентов в критическом состоянии',
    },
    {
      id: 8,
      title: 'Раздача вечерних лекарств',
      time: '20:30',
      status: 'pending',
      icon: '💊',
      description: 'Выдача вечерней дозы препаратов',
    },
  ];

  // Текущие задачи для заведующего
  const headTasks = [
    {
      id: 1,
      title: 'Утренняя планерка',
      time: '08:30',
      status: 'pending',
      icon: '📊',
      description: 'Распределение нагрузки, обсуждение сложных пациентов',
    },
    {
      id: 2,
      title: 'Контроль качества лечения',
      time: '11:00',
      status: 'pending',
      icon: '👥',
      description: 'Проверка выполнения стандартов лечения, работа с документацией',
    },
    {
      id: 3,
      title: 'Анализ показателей отделения',
      time: '13:00',
      status: 'pending',
      icon: '📈',
      description: 'Оценка эффективности работы, статистика госпитализации',
    },
    {
      id: 4,
      title: 'Совещание с врачами',
      time: '15:30',
      status: 'pending',
      icon: '💼',
      description: 'Обсуждение тактики лечения сложных случаев',
    },
    {
      id: 5,
      title: 'Контроль вечернего обхода',
      time: '19:30',
      status: 'pending',
      icon: '👁️',
      description: 'Проверка выполнения назначений, состояния пациентов',
    },
  ];

  const tasks = userRole === 'doctor' ? doctorTasks : 
                userRole === 'nurse' ? nurseTasks : headTasks;

  // Быстрые действия в зависимости от роли
  const getQuickActions = () => {
    const commonActions = [
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

    if (userRole === 'doctor') {
      return [
        ...commonActions,
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
          onPress: () => navigation.navigate('Patients'),
        },
      ];
    } else // В функции getQuickActions в HomeScreen.js исправьте секцию для медсестры:
if (userRole === 'nurse') {
  return [
    {
      id: 'nurse_round',
      title: 'Начать обход',
      description: 'Выполнение назначений пациентам',
      icon: '🚶‍♀️',
      iconColor: '#28a745',
      backgroundColor: 'rgba(40, 167, 69, 0.1)',
      onPress: () => navigation.navigate('NurseRoute', { initialFilter: 'today' }), // Добавьте initialFilter
    },
    {
      id: 'patients',
      title: 'Пациенты',
      description: 'Просмотр списка пациентов',
      icon: '👥',
      iconColor: '#007aff',
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
      onPress: () => navigation.navigate('Patients'),
    },
    {
      id: 'medications',
      title: 'Лекарства',
      description: 'Список препаратов для выдачи',
      icon: '💊',
      iconColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      onPress: () => navigation.navigate('NurseRoute', { 
        initialFilter: 'medication', 
        tab: 'medication' 
      }),
    },
    {
      id: 'procedures',
      title: 'Процедуры',
      description: 'План процедур на сегодня',
      icon: '🩺',
      iconColor: '#17a2b8',
      backgroundColor: 'rgba(23, 162, 184, 0.1)',
      onPress: () => navigation.navigate('NurseRoute', { 
        initialFilter: 'procedures', 
        tab: 'procedures' 
      }),
    },
  ];
    } else { // Заведующий отделением
      return [
        ...commonActions,
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
    .slice(0, 2);

  // Задачи на сегодня (сгруппированные по времени)
  const getTasksByTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    return {
      morning: tasks.filter(t => {
        const taskHour = parseInt(t.time.split(':')[0]);
        return taskHour >= 6 && taskHour < 12 && taskHour >= currentHour;
      }),
      afternoon: tasks.filter(t => {
        const taskHour = parseInt(t.time.split(':')[0]);
        return taskHour >= 12 && taskHour < 18 && taskHour >= currentHour;
      }),
      evening: tasks.filter(t => {
        const taskHour = parseInt(t.time.split(':')[0]);
        return taskHour >= 18 && taskHour < 24 && taskHour >= currentHour;
      }),
      completed: tasks.filter(t => {
        const taskHour = parseInt(t.time.split(':')[0]);
        return taskHour < currentHour;
      }).slice(0, 2), // Последние 2 выполненные
    };
  };

  const tasksByTime = getTasksByTime();

  const renderHeader = () => (
    <View style={homeStyles.header}>
      <View style={homeStyles.headerContent}>
        <View style={homeStyles.userInfo}>
          <Text style={homeStyles.welcomeText}>Добро пожаловать,</Text>
          <Text style={homeStyles.userName}>{firstName}</Text>
          <View style={homeStyles.userRoleContainer}>
            <Text style={homeStyles.userRole}>
              {getRoleText(userRole)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={homeStyles.logoutButton}
          onPress={() => {
            logout();
          }}
        >
          <Text style={homeStyles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      {/* Статистика в зависимости от роли */}
      <View style={homeStyles.statsContainer}>
        {userRole === 'nurse' && appointmentStats ? (
          // Статистика для медсестры
          <>
            <View style={homeStyles.statCard}>
              <Text style={homeStyles.statValue}>{appointmentStats.todays}</Text>
              <Text style={homeStyles.statLabel}>Сегодня</Text>
            </View>
            <View style={homeStyles.statCard}>
              <Text style={[homeStyles.statValue, { color: '#dc3545' }]}>{appointmentStats.urgent}</Text>
              <Text style={homeStyles.statLabel}>Срочные</Text>
            </View>
            <View style={homeStyles.statCard}>
              <Text style={[homeStyles.statValue, { color: '#28a745' }]}>{appointmentStats.upcoming}</Text>
              <Text style={homeStyles.statLabel}>Ближайшие</Text>
            </View>
          </>
        ) : (
          // Статистика для врача и заведующего
          <>
            <View style={homeStyles.statCard}>
              <Text style={homeStyles.statValue}>{patientStats.total}</Text>
              <Text style={homeStyles.statLabel}>Всего пациентов</Text>
            </View>
            <View style={homeStyles.statCard}>
              <Text style={[homeStyles.statValue, { color: '#dc3545' }]}>{patientStats.critical}</Text>
              <Text style={homeStyles.statLabel}>Критическое</Text>
            </View>
            <View style={homeStyles.statCard}>
              <Text style={[homeStyles.statValue, { color: '#ff9800' }]}>{patientStats.warning}</Text>
              <Text style={homeStyles.statLabel}>Требует внимания</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={homeStyles.section}>
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
    <View style={homeStyles.section}>
      <View style={homeStyles.patientsHeader}>
        <Text style={homeStyles.sectionTitle}>Пациенты, требующие внимания</Text>
        <TouchableOpacity
          style={homeStyles.seeAllButton}
          onPress={() => navigation.navigate('Patients')}
        >
          <Text style={homeStyles.seeAllText}>Все →</Text>
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
                Палата {patient.room} • NEWS: {patient.newsScore}
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

  const renderNurseAppointments = () => (
    <View style={homeStyles.section}>
      <View style={homeStyles.patientsHeader}>
        <Text style={homeStyles.sectionTitle}>Ближайшие назначения</Text>
        <TouchableOpacity
          style={homeStyles.seeAllButton}
          onPress={() => navigation.navigate('NurseRoute')}
        >
          <Text style={homeStyles.seeAllText}>Все →</Text>
        </TouchableOpacity>
      </View>

      {upcomingAppointments.length > 0 ? (
        upcomingAppointments.map((apt, index) => (
          <TouchableOpacity
            key={apt.id}
            style={[
              homeStyles.appointmentCard,
              apt.priority === 'high' && homeStyles.urgentCard
            ]}
            onPress={() => {
              const patient = patients.find(p => p.id === apt.patientId);
              if (patient) {
                navigation.navigate('PatientCard', { patient });
              }
            }}
            activeOpacity={0.7}
          >
            <View style={homeStyles.appointmentHeader}>
              <Text style={homeStyles.appointmentPatient}>
                {apt.patientName}
              </Text>
              <Text style={homeStyles.appointmentRoom}>
                Палата {apt.room}
              </Text>
            </View>
            <Text style={homeStyles.appointmentTitle}>
              {apt.name}
            </Text>
            <View style={homeStyles.appointmentFooter}>
              {apt.nextDue ? (
                <Text style={homeStyles.appointmentTime}>
                  ⏰ {new Date(apt.nextDue).toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              ) : apt.schedule?.times?.[0] ? (
                <Text style={homeStyles.appointmentTime}>
                  ⏰ {apt.schedule.times[0]}
                </Text>
              ) : null}
              <View style={[
                homeStyles.priorityBadge,
                { 
                  backgroundColor: 
                    apt.priority === 'high' ? '#dc3545' :
                    apt.priority === 'medium' ? '#ff9800' : '#28a745'
                }
              ]}>
                <Text style={homeStyles.priorityText}>
                  {apt.priority === 'high' ? 'Срочно' : 
                   apt.priority === 'medium' ? 'Средний' : 'Планово'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={homeStyles.emptyState}>
          <Text style={homeStyles.emptyIcon}>🎉</Text>
          <Text style={homeStyles.emptyText}>Нет назначений на ближайшее время</Text>
        </View>
      )}
    </View>
  );

  const renderDailyTasks = () => (
    <View style={homeStyles.section}>
      <View style={homeStyles.patientsHeader}>
        <Text style={homeStyles.sectionTitle}>Задачи на сегодня</Text>
        <TouchableOpacity
          style={homeStyles.seeAllButton}
          onPress={() => {}}
        >
          <Text style={homeStyles.seeAllText}>Все {tasks.length} →</Text>
        </TouchableOpacity>
      </View>

      {/* Текущие/ближайшие задачи */}
      {tasksByTime.morning.length > 0 && (
        <>
          <Text style={homeStyles.timeSectionTitle}>Утренние ({tasksByTime.morning.length})</Text>
          {tasksByTime.morning.slice(0, 2).map(task => (
            <View key={task.id} style={homeStyles.taskItem}>
              <View style={homeStyles.taskIconContainer}>
                <Text style={homeStyles.taskIcon}>{task.icon}</Text>
              </View>
              <View style={homeStyles.taskInfo}>
                <Text style={homeStyles.taskTitle}>{task.title}</Text>
                <Text style={homeStyles.taskTime}>{task.time}</Text>
                <Text style={homeStyles.taskDescription} numberOfLines={1}>
                  {task.description}
                </Text>
              </View>
              <View style={homeStyles.taskStatusBadge}>
                <Text style={homeStyles.taskStatusText}>⏳</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {tasksByTime.afternoon.length > 0 && (
        <>
          <Text style={[homeStyles.timeSectionTitle, { marginTop: 15 }]}>
            Дневные ({tasksByTime.afternoon.length})
          </Text>
          {tasksByTime.afternoon.slice(0, 1).map(task => (
            <View key={task.id} style={homeStyles.taskItem}>
              <View style={homeStyles.taskIconContainer}>
                <Text style={homeStyles.taskIcon}>{task.icon}</Text>
              </View>
              <View style={homeStyles.taskInfo}>
                <Text style={homeStyles.taskTitle}>{task.title}</Text>
                <Text style={homeStyles.taskTime}>{task.time}</Text>
                <Text style={homeStyles.taskDescription} numberOfLines={1}>
                  {task.description}
                </Text>
              </View>
              <View style={homeStyles.taskStatusBadge}>
                <Text style={homeStyles.taskStatusText}>⏳</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Завершенные задачи */}
      {tasksByTime.completed.length > 0 && (
        <>
          <Text style={[homeStyles.timeSectionTitle, { marginTop: 15, color: '#28a745' }]}>
            Выполнено ({tasksByTime.completed.length})
          </Text>
          {tasksByTime.completed.map(task => (
            <View key={task.id} style={[homeStyles.taskItem, homeStyles.completedTask]}>
              <View style={homeStyles.taskIconContainer}>
                <Text style={homeStyles.taskIcon}>{task.icon}</Text>
              </View>
              <View style={homeStyles.taskInfo}>
                <Text style={[homeStyles.taskTitle, { color: '#666' }]}>{task.title}</Text>
                <Text style={[homeStyles.taskTime, { color: '#999' }]}>{task.time}</Text>
              </View>
              <View style={[homeStyles.taskStatusBadge, { backgroundColor: 'rgba(40, 167, 69, 0.2)' }]}>
                <Text style={[homeStyles.taskStatusText, { color: '#28a745' }]}>✓</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {tasks.length === 0 && (
        <View style={homeStyles.emptyState}>
          <Text style={homeStyles.emptyIcon}>📋</Text>
          <Text style={homeStyles.emptyText}>Нет задач на сегодня</Text>
        </View>
      )}
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
          
          {userRole === 'nurse' ? renderNurseAppointments() : renderCriticalPatients()}
          
          {renderDailyTasks()}
        </View>
        
        {renderFooter()}
      </ScrollView>
    </SafeAreaView>
  );
}
