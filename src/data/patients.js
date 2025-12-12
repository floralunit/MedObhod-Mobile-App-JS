import { activeAppointments } from './appointments';
export const patients = [
  {
    id: 1,
    name: "Иванов Иван Иванович",
    age: 54,
    diagnosis: "Пневмония",
    room: "203",
    status: "stable",
    newsScore: 2,
    vitals: [
      { time: "2025-01-10T08:00:00", temp: 36.9, pulse: 88, bp: "125/80", spo2: 95, rr: 18 },
      { time: "2025-01-10T12:00:00", temp: 37.2, pulse: 92, bp: "120/78", spo2: 96, rr: 20 },
      { time: "2025-01-10T16:00:00", temp: 37.4, pulse: 95, bp: "118/77", spo2: 94, rr: 19 },
      { time: "2025-01-10T20:00:00", temp: 37.1, pulse: 90, bp: "122/79", spo2: 96, rr: 18 },
      { time: "2025-01-11T08:00:00", temp: 37.0, pulse: 86, bp: "122/80", spo2: 96, rr: 17 },
      { time: "2025-01-11T12:00:00", temp: 36.8, pulse: 84, bp: "120/78", spo2: 97, rr: 16 },
      { time: "2025-01-11T16:00:00", temp: 36.6, pulse: 82, bp: "118/76", spo2: 98, rr: 16 },
      { time: "2025-01-11T20:00:00", temp: 36.5, pulse: 80, bp: "115/75", spo2: 98, rr: 15 },
    ],
        appointments: [
      {
        id: 'app_1',
        type: 'injection',
        name: 'Цефтриаксон 1.0 г в/м',
        schedule: { frequency: 'every_12h', startDate: '2025-12-12', endDate: '2025-12-15' },
        nextDue: '2025-12-12T14:00:00',
        status: 'pending', // pending, completed, missed
        room: '203',
        priority: 'high',
        duration: 10,
        notes: 'Вводить глубоко в/м, предварительно развести 2 мл лидокаина'
      }
    ],
    notes: "Стабильное состояние. Назначено лечение. Пациент реагирует на терапию."
  },
  {
    id: 2,
    name: "Петрова Анна Сергеевна",
    age: 67,
    diagnosis: "Сердечная недостаточность",
    room: "115",
    status: "critical",
    newsScore: 7,
    vitals: [
      { time: "2025-01-10T08:00:00", temp: 37.3, pulse: 105, bp: "95/60", spo2: 88, rr: 24 },
      { time: "2025-01-10T12:00:00", temp: 37.6, pulse: 112, bp: "90/58", spo2: 86, rr: 26 },
      { time: "2025-01-10T16:00:00", temp: 38.1, pulse: 118, bp: "88/55", spo2: 85, rr: 28 },
      { time: "2025-01-10T20:00:00", temp: 38.3, pulse: 120, bp: "85/53", spo2: 84, rr: 29 },
      { time: "2025-01-11T08:00:00", temp: 37.7, pulse: 110, bp: "92/57", spo2: 87, rr: 25 },
      { time: "2025-01-11T12:00:00", temp: 37.4, pulse: 108, bp: "94/59", spo2: 89, rr: 23 },
      { time: "2025-01-11T16:00:00", temp: 37.1, pulse: 102, bp: "96/61", spo2: 90, rr: 22 },
      { time: "2025-01-11T20:00:00", temp: 36.9, pulse: 98, bp: "98/63", spo2: 92, rr: 20 },
    ],
    notes: "Критическое состояние. Требуется наблюдение каждые 2 часа. Проведена коррекция терапии."
  },
  {
    id: 3,
    name: "Сидоров Алексей Петрович",
    age: 42,
    diagnosis: "Послеоперационный период",
    room: "309",
    status: "warning",
    newsScore: 5,
    vitals: [
      { time: "2025-01-10T08:00:00", temp: 37.1, pulse: 94, bp: "120/80", spo2: 95, rr: 19 },
      { time: "2025-01-10T12:00:00", temp: 37.5, pulse: 100, bp: "118/78", spo2: 94, rr: 18 },
      { time: "2025-01-10T16:00:00", temp: 37.2, pulse: 97, bp: "119/79", spo2: 95, rr: 18 },
      { time: "2025-01-10T20:00:00", temp: 37.0, pulse: 95, bp: "121/80", spo2: 96, rr: 17 },
      { time: "2025-01-11T08:00:00", temp: 36.9, pulse: 90, bp: "122/81", spo2: 97, rr: 17 },
      { time: "2025-01-11T12:00:00", temp: 36.7, pulse: 88, bp: "120/79", spo2: 98, rr: 16 },
      { time: "2025-01-11T16:00:00", temp: 36.6, pulse: 85, bp: "118/77", spo2: 98, rr: 16 },
      { time: "2025-01-11T20:00:00", temp: 36.5, pulse: 82, bp: "115/75", spo2: 99, rr: 15 },
    ],
    notes: "После операции по аппендэктомии. Восстановление среднее. Болевой синдром купирован."
  }
];