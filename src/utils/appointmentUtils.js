import { HOSPITAL_CONFIG } from '../constants/hospitalConfig';

// Генерация временных слотов на основе частоты
export const generateTimeSlots = (frequency, startTime = '08:00') => {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  
  switch (frequency) {
    case 'once_daily':
      slots.push(startTime);
      break;
      
    case 'twice_daily':
      slots.push(startTime);
      slots.push(`${startHour + 12}:${startMinute.toString().padStart(2, '0')}`);
      break;
      
    case 'three_times_daily':
      slots.push(startTime);
      slots.push(`${startHour + 6}:${startMinute.toString().padStart(2, '0')}`);
      slots.push(`${startHour + 12}:${startMinute.toString().padStart(2, '0')}`);
      break;
      
    case 'four_times_daily':
      slots.push(startTime);
      slots.push(`${startHour + 6}:${startMinute.toString().padStart(2, '0')}`);
      slots.push(`${startHour + 12}:${startMinute.toString().padStart(2, '0')}`);
      slots.push(`${startHour + 18}:${startMinute.toString().padStart(2, '0')}`);
      break;
      
    case 'every_6h':
      for (let i = 0; i < 4; i++) {
        const hour = (startHour + i * 6) % 24;
        slots.push(`${hour}:${startMinute.toString().padStart(2, '0')}`);
      }
      break;
      
    case 'every_8h':
      for (let i = 0; i < 3; i++) {
        const hour = (startHour + i * 8) % 24;
        slots.push(`${hour}:${startMinute.toString().padStart(2, '0')}`);
      }
      break;
      
    case 'every_12h':
      slots.push(startTime);
      slots.push(`${(startHour + 12) % 24}:${startMinute.toString().padStart(2, '0')}`);
      break;
      
    default:
      slots.push(startTime);
  }
  
  return slots.map(time => {
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });
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