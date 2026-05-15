import { HOSPITAL_CONFIG } from '../constants/hospitalConfig';

// Генерация временных слотов на основе частоты
// utils/appointmentUtils.js

export const generateTimeSlots = (frequency, startTime = '08:00') => {
  // Защита от undefined/null
  if (!startTime || typeof startTime !== 'string') {
    startTime = '08:00';
  }
  
  const slots = [];
  const parts = startTime.split(':');
  const startHour = parseInt(parts[0]) || 8;
  const startMinute = parseInt(parts[1]) || 0;
  
  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };
  
  switch (frequency) {
    case 'once_daily':
      slots.push(formatTime(startHour, startMinute));
      break;
      
    case 'twice_daily':
      slots.push(formatTime(startHour, startMinute));
      slots.push(formatTime((startHour + 12) % 24, startMinute));
      break;
      
    case 'three_times_daily':
      slots.push(formatTime(startHour, startMinute));
      slots.push(formatTime((startHour + 8) % 24, startMinute));
      slots.push(formatTime((startHour + 16) % 24, startMinute));
      break;
      
    case 'four_times_daily':
      slots.push(formatTime(startHour, startMinute));
      slots.push(formatTime((startHour + 6) % 24, startMinute));
      slots.push(formatTime((startHour + 12) % 24, startMinute));
      slots.push(formatTime((startHour + 18) % 24, startMinute));
      break;
      
    case 'every_6h':
      for (let i = 0; i < 4; i++) {
        slots.push(formatTime((startHour + i * 6) % 24, startMinute));
      }
      break;
      
    case 'every_8h':
      for (let i = 0; i < 3; i++) {
        slots.push(formatTime((startHour + i * 8) % 24, startMinute));
      }
      break;
      
    case 'every_12h':
      slots.push(formatTime(startHour, startMinute));
      slots.push(formatTime((startHour + 12) % 24, startMinute));
      break;
      
    case 'as_needed':
    case 'stat':
      slots.push(formatTime(startHour, startMinute));
      break;
      
    default:
      slots.push(formatTime(startHour, startMinute));
  }
  
  return slots;
};

// Расчет следующего времени выполнения
export const calculateNextDueTime = (schedule, lastCompleted = null) => {
  if (!schedule.times || schedule.times.length === 0) return null;
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  // Если есть расписание, находим ближайшее время сегодня
  const times = schedule.times.map(time => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }).sort((a, b) => a - b);
  
  // Ищем ближайшее будущее время
  const nextTime = times.find(time => time > now);
  
  if (nextTime) {
    return nextTime.toISOString();
  }
  
  // Если все время прошло сегодня, берем первое время завтра
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(times[0].getHours(), times[0].getMinutes(), 0, 0);
  
  return tomorrow.toISOString();
};

// Проверка, нужно ли выполнять назначение сейчас
export const isDueNow = (appointment) => {
  if (!appointment.nextDue) return false;
  
  const dueTime = new Date(appointment.nextDue);
  const now = new Date();
  const timeDiff = (dueTime - now) / (1000 * 60); // Разница в минутах
  
  // Считаем назначение актуальным за 30 минут до и через 15 минут после времени
  return timeDiff >= -30 && timeDiff <= 15;
};

// Получение ближайших назначений для медсестры
export const getUpcomingAppointments = (appointments, hoursAhead = 4) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  
  return appointments
    .filter(app => {
      if (app.status !== 'pending') return false;
      if (!app.nextDue) return false;
      
      const dueTime = new Date(app.nextDue);
      return dueTime <= cutoff;
    })
    .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
};