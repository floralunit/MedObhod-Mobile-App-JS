import { HOSPITAL_CONFIG } from '../constants/hospitalConfig';
import { generateTimeSlots, calculateNextDueTime } from '../utils/appointmentUtils';

// Шаблоны назначений
export const appointmentTemplates = [
  { id: 'inj_antibio', name: 'Антибиотик в/м', type: 'injection', durationMin: 10, color: '#FF6B6B', requiresMedication: true },
  { id: 'tab_morning', name: 'Таблетки (утро)', type: 'medication', durationMin: 5, color: '#4ECDC4', requiresMedication: true },
  { id: 'proc_dropper', name: 'Капельница', type: 'iv_drip', durationMin: 45, color: '#45B7D1', requiresMedication: true },
  { id: 'meas_vitals', name: 'Измерение показателей', type: 'observation', durationMin: 15, color: '#FFEAA7', requiresMedication: false },
  { id: 'dressing', name: 'Перевязка', type: 'dressing', durationMin: 20, color: '#DDA0DD', requiresMedication: false },
];

// База лекарств
export const medications = [
  { id: 1, name: 'Цефтриаксон', form: 'порошок для инъекций', dosage: '1.0 г', category: 'antibiotic' },
  { id: 2, name: 'Амоксиклав', form: 'таблетки', dosage: '625 мг', category: 'antibiotic' },
  { id: 3, name: 'Метформин', form: 'таблетки', dosage: '850 мг', category: 'diabetes' },
  { id: 4, name: 'Физраствор 0.9%', form: 'раствор для инфузий', dosage: '200 мл', category: 'infusion' },
  { id: 5, name: 'Метопролол', form: 'таблетки', dosage: '50 мг', category: 'cardio' },
  { id: 6, name: 'Фуросемид', form: 'раствор для инъекций', dosage: '20 мг', category: 'diuretic' },
  { id: 7, name: 'Кеторол', form: 'таблетки', dosage: '10 мг', category: 'analgesic' },
  { id: 8, name: 'Омепразол', form: 'таблетки', dosage: '20 мг', category: 'gastro' },
  { id: 9, name: 'Амлодипин', form: 'таблетки', dosage: '5 мг', category: 'cardio' },
  { id: 10, name: 'Глюкоза 5%', form: 'раствор для инфузий', dosage: '400 мл', category: 'infusion' },
];

// НАЧАЛЬНЫЕ НАЗНАЧЕНИЯ (вместо извлечения из пациентов)
export let allAppointments = [
  // Пациент 1: Иванов Иван Иванович
  {
    id: 'app_1_1',
    patientId: 1,
    patientName: "Иванов Иван Иванович",
    room: "203",
    type: 'injection',
    name: 'Цефтриаксон 1.0 г в/м',
    medication: { name: 'Цефтриаксон', dosage: '1.0 г', form: 'порошок для инъекций' },
    schedule: { 
      frequency: 'every_12h', 
      startDate: '2025-12-12', 
      endDate: '2025-12-15',
      startTime: '08:00',
      times: ['08:00', '20:00'],
      relationToMeal: 'В любое время'
    },
    nextDue: '2025-12-13T08:00:00',
    status: 'pending',
    priority: 'high',
    duration: 10,
    instructions: 'Вводить глубоко в/м, предварительно развести 2 мл лидокаина',
    notes: '',
    createdAt: '2025-12-12T08:00:00',
    createdBy: 'doctor1'
  },
  {
    id: 'app_1_2',
    patientId: 1,
    patientName: "Иванов Иван Иванович",
    room: "203",
    type: 'medication',
    name: 'Амоксиклав 625 мг - Таблетки перорально',
    medication: { name: 'Амоксиклав', dosage: '625 мг', form: 'таблетки' },
    schedule: { 
      frequency: 'three_times_daily', 
      startDate: '2025-12-12', 
      endDate: '2025-12-18',
      startTime: '08:00',
      times: ['08:00', '14:00', '20:00'],
      relationToMeal: 'За 30 минут до еды'
    },
    nextDue: '2025-12-13T08:00:00',
    status: 'pending',
    priority: 'medium',
    duration: 5,
    instructions: 'Принимать за 30 минут до еды, запивать водой',
    notes: '',
    createdAt: '2025-12-12T09:00:00',
    createdBy: 'doctor1'
  },
  // Пациент 2: Петрова Анна Сергеевна
  {
    id: 'app_2_1',
    patientId: 2,
    patientName: "Петрова Анна Сергеевна",
    room: "115",
    type: 'medication',
    name: 'Метопролол 50 мг - Таблетки перорально',
    medication: { name: 'Метопролол', dosage: '50 мг', form: 'таблетки' },
    schedule: { 
      frequency: 'twice_daily', 
      startDate: '2025-12-12', 
      endDate: '2025-12-19',
      startTime: '08:00',
      times: ['08:00', '20:00'],
      relationToMeal: 'Во время еды'
    },
    nextDue: '2025-12-13T08:00:00',
    status: 'pending',
    priority: 'high',
    duration: 5,
    instructions: 'Принимать утром и вечером во время еды',
    notes: 'Контроль АД перед приемом',
    createdAt: '2025-12-12T08:00:00',
    createdBy: 'doctor1'
  },
  {
    id: 'app_2_2',
    patientId: 2,
    patientName: "Петрова Анна Сергеевна",
    room: "115",
    type: 'observation',
    name: 'Измерение показателей',
    schedule: { 
      frequency: 'every_6h', 
      startDate: '2025-12-12', 
      endDate: '2025-12-15',
      startTime: '08:00',
      times: ['08:00', '14:00', '20:00', '02:00'],
      relationToMeal: 'В любое время'
    },
    nextDue: '2025-12-13T08:00:00',
    status: 'pending',
    priority: 'high',
    duration: 15,
    instructions: 'Измерить АД, ЧСС, температуру, сатурацию',
    notes: 'Особое внимание на АД и сатурацию',
    createdAt: '2025-12-12T08:00:00',
    createdBy: 'doctor1'
  },
  // Пациент 3: Сидоров Алексей Петрович
  {
    id: 'app_3_1',
    patientId: 3,
    patientName: "Сидоров Алексей Петрович",
    room: "309",
    type: 'medication',
    name: 'Кеторол 10 мг - Таблетки перорально',
    medication: { name: 'Кеторол', dosage: '10 мг', form: 'таблетки' },
    schedule: { 
      frequency: 'three_times_daily', 
      startDate: '2025-12-12', 
      endDate: '2025-12-14',
      startTime: '08:00',
      times: ['08:00', '14:00', '20:00'],
      relationToMeal: 'После еды'
    },
    nextDue: '2025-12-13T08:00:00',
    status: 'pending',
    priority: 'medium',
    duration: 5,
    instructions: 'Принимать при болях, не более 3 раз в сутки',
    notes: 'Контроль болевого синдрома',
    createdAt: '2025-12-12T08:00:00',
    createdBy: 'doctor1'
  },
  {
    id: 'app_3_2',
    patientId: 3,
    patientName: "Сидоров Алексей Петрович",
    room: "309",
    type: 'dressing',
    name: 'Перевязка',
    schedule: { 
      frequency: 'once_daily', 
      startDate: '2025-12-12', 
      endDate: '2025-12-15',
      startTime: '10:00',
      times: ['10:00'],
      relationToMeal: 'В любое время'
    },
    nextDue: '2025-12-13T10:00:00',
    status: 'pending',
    priority: 'medium',
    duration: 20,
    instructions: 'Обработать рану антисептиком, наложить стерильную повязку',
    notes: 'Осмотр раны на признаки воспаления',
    createdAt: '2025-12-12T10:00:00',
    createdBy: 'doctor1'
  }
];

// Функции для работы с назначениями
export const addAppointment = (appointment) => {
  // Генерируем временные слоты на основе частоты
  if (appointment.schedule.frequency && appointment.schedule.startTime) {
    const slots = generateTimeSlots(
      appointment.schedule.frequency,
      appointment.schedule.startTime
    );
    appointment.schedule.times = slots;
  }
  
  // Рассчитываем следующее время выполнения
  appointment.nextDue = calculateNextDueTime(appointment.schedule);
  
  allAppointments.push(appointment);
  return [...allAppointments];
};

export const completeAppointment = (appointmentId) => {
  const index = allAppointments.findIndex(a => a.id === appointmentId);
  if (index !== -1) {
    const appointment = allAppointments[index];
    appointment.status = 'completed';
    appointment.completedAt = new Date().toISOString();
    
    // Если назначение повторяющееся, обновляем nextDue
    if (appointment.schedule.frequency !== 'stat' && 
        appointment.schedule.frequency !== 'as_needed' &&
        appointment.schedule.times.length > 0) {
      appointment.nextDue = calculateNextDueTime(appointment.schedule);
      appointment.status = 'pending'; // Сбрасываем статус для следующего приема
    }
  }
};

export const getAppointmentsByPatient = (patientId) => {
  return allAppointments.filter(a => a.patientId === patientId);
};

export const getPendingAppointments = () => {
  return allAppointments.filter(a => a.status === 'pending');
};

export const getTodaysAppointments = () => {
  const today = new Date().toISOString().split('T')[0];
  return allAppointments.filter(a => {
    if (a.status !== 'pending') return false;
    if (!a.nextDue) return true; // Если нет nextDue, считаем что на сегодня
    const dueDate = a.nextDue.split('T')[0];
    return dueDate === today;
  });
};

export const getUpcomingAppointmentsForNurse = () => {
  const now = new Date();
  const upcoming = getPendingAppointments()
    .filter(app => {
      if (!app.nextDue) return true; // Если нет времени, показываем
      const dueTime = new Date(app.nextDue);
      const timeDiff = (dueTime - now) / (1000 * 60); // Разница в минутах
      return timeDiff <= 240 && timeDiff >= -30; // +/- 4 часа
    })
    .sort((a, b) => {
      // Сначала те, у которых есть время
      if (!a.nextDue && b.nextDue) return 1;
      if (a.nextDue && !b.nextDue) return -1;
      if (!a.nextDue && !b.nextDue) return 0;
      return new Date(a.nextDue) - new Date(b.nextDue);
    });
  
  return upcoming;
};