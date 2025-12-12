export const appointmentTemplates = [
  { id: 'inj_antibio', name: 'Антибиотик в/м', type: 'injection', durationMin: 10, color: '#FF6B6B' },
  { id: 'tab_morning', name: 'Таблетки (утро)', type: 'medication', durationMin: 5, color: '#4ECDC4' },
  { id: 'proc_dropper', name: 'Капельница', type: 'procedure', durationMin: 45, color: '#45B7D1' },
  { id: 'meas_vitals', name: 'Измерение показателей', type: 'measurement', durationMin: 15, color: '#FFEAA7' },
  { id: 'dressing', name: 'Перевязка', type: 'procedure', durationMin: 20, color: '#DDA0DD' },
];

export const medications = [
  { id: 1, name: 'Цефтриаксон', form: 'порошок для инъекций', dosage: '1.0 г' },
  { id: 2, name: 'Амоксиклав', form: 'таблетки', dosage: '625 мг' },
  { id: 3, name: 'Метформин', form: 'таблетки', dosage: '850 мг' },
  { id: 4, name: 'Физраствор 0.9%', form: 'раствор для инфузий', dosage: '200 мл' },
];

// ВСЕ назначения хранятся здесь
export let allAppointments = [
  {
    id: 'app_1',
    patientId: 1, // Связь по ID пациента
    patientName: "Иванов Иван Иванович",
    room: "203",
    type: 'injection',
    name: 'Цефтриаксон 1.0 г в/м',
    medication: 'Цефтриаксон',
    schedule: { 
      frequency: 'every_12h', 
      startDate: '2025-12-12', 
      endDate: '2025-12-15',
      times: ['08:00', '20:00']
    },
    nextDue: '2025-12-12T14:00:00',
    status: 'pending', // pending, completed, missed
    priority: 'high',
    duration: 10,
    notes: 'Вводить глубоко в/м, предварительно развести 2 мл лидокаина',
    createdAt: '2025-12-12T08:00:00',
    createdBy: 'doctor1'
  }
];

// Функции для работы с назначениями
export const addAppointment = (appointment) => {
  allAppointments.push(appointment);
  return [...allAppointments];
};

export const completeAppointment = (appointmentId) => {
  const index = allAppointments.findIndex(a => a.id === appointmentId);
  if (index !== -1) {
    allAppointments[index].status = 'completed';
    allAppointments[index].completedAt = new Date().toISOString();
  }
};

export const getAppointmentsByPatient = (patientId) => {
  return allAppointments.filter(a => a.patientId === patientId);
};

export const getPendingAppointments = () => {
  return allAppointments.filter(a => a.status === 'pending');
};