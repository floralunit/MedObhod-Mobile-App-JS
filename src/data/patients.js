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
      { time: "2025-01-10 08:00", temp: 36.9, pulse: 88, bp: "125/80", spo2: 95, rr: 18 },
      { time: "2025-01-10 12:00", temp: 37.2, pulse: 92, bp: "120/78", spo2: 96, rr: 20 },
      { time: "2025-01-10 16:00", temp: 37.4, pulse: 95, bp: "118/77", spo2: 94, rr: 19 },
      { time: "2025-01-11 08:00", temp: 37.0, pulse: 86, bp: "122/80", spo2: 96, rr: 17 }
    ],
    notes: "Стабильное состояние. Назначено лечение."
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
      { time: "2025-01-10 08:00", temp: 37.3, pulse: 105, bp: "95/60", spo2: 88, rr: 24 },
      { time: "2025-01-10 12:00", temp: 37.6, pulse: 112, bp: "90/58", spo2: 86, rr: 26 },
      { time: "2025-01-10 16:00", temp: 38.1, pulse: 118, bp: "88/55", spo2: 85, rr: 28 },
      { time: "2025-01-11 08:00", temp: 37.7, pulse: 110, bp: "92/57", spo2: 87, rr: 25 }
    ],
    notes: "Требуется наблюдение каждые 2 часа."
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
      { time: "2025-01-10 08:00", temp: 37.1, pulse: 94, bp: "120/80", spo2: 95, rr: 19 },
      { time: "2025-01-10 12:00", temp: 37.5, pulse: 100, bp: "118/78", spo2: 94, rr: 18 },
      { time: "2025-01-10 16:00", temp: 37.2, pulse: 97, bp: "119/79", spo2: 95, rr: 18 },
      { time: "2025-01-11 08:00", temp: 36.9, pulse: 90, bp: "122/81", spo2: 97, rr: 17 }
    ],
    notes: "После операции. Восстановление среднее."
  }
];
