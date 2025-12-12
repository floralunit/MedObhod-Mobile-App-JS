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
    ],
    notes: "Стабильное состояние. Назначено лечение. Пациент реагирует на терапию.",
    // НАЗНАЧЕНИЯ ДЛЯ ПАЦИЕНТА
    appointments: [
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
      {
        id: 'app_1_3',
        patientId: 1,
        patientName: "Иванов Иван Иванович",
        room: "203",
        type: 'iv_drip',
        name: 'Натрия хлорид 200 мл - Капельница',
        medication: { name: 'Натрия хлорид', dosage: '200 мл', form: 'раствор для инфузий' },
        schedule: { 
          frequency: 'once_daily', 
          startDate: '2025-12-12', 
          endDate: '2025-12-14',
          startTime: '10:00',
          times: ['10:00'],
          relationToMeal: 'В любое время'
        },
        nextDue: '2025-12-13T10:00:00',
        status: 'pending',
        priority: 'medium',
        duration: 45,
        instructions: 'Внутривенная инфузия со скоростью 60 капель/мин',
        medicalForm: { route: 'в/в', rate: '60 капель/мин' },
        notes: '',
        createdAt: '2025-12-12T10:00:00',
        createdBy: 'doctor1'
      }
    ]
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
    ],
    notes: "Критическое состояние. Требуется наблюдение каждые 2 часа. Проведена коррекция терапии.",
    // НАЗНАЧЕНИЯ ДЛЯ ПАЦИЕНТА
    appointments: [
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
      {
        id: 'app_2_3',
        patientId: 2,
        patientName: "Петрова Анна Сергеевна",
        room: "115",
        type: 'iv_drip',
        name: 'Фуросемид 20 мг в/в - Капельница',
        medication: { name: 'Фуросемид', dosage: '20 мг', form: 'раствор для инъекций' },
        schedule: { 
          frequency: 'once_daily', 
          startDate: '2025-12-12', 
          endDate: '2025-12-13',
          startTime: '09:00',
          times: ['09:00'],
          relationToMeal: 'В любое время'
        },
        nextDue: '2025-12-13T09:00:00',
        status: 'pending',
        priority: 'high',
        duration: 30,
        instructions: 'Вводить медленно в/в в течение 30 мин',
        medicalForm: { route: 'в/в', rate: 'медленно' },
        notes: 'Контроль диуреза после введения',
        createdAt: '2025-12-12T09:00:00',
        createdBy: 'doctor1'
      }
    ]
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
    ],
    notes: "После операции по аппендэктомии. Восстановление среднее. Болевой синдром купирован.",
    // НАЗНАЧЕНИЯ ДЛЯ ПАЦИЕНТА
    appointments: [
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
      },
      {
        id: 'app_3_3',
        patientId: 3,
        patientName: "Сидоров Алексей Петрович",
        room: "309",
        type: 'iv_drip',
        name: 'Глюкоза 5% 400 мл - Капельница',
        medication: { name: 'Глюкоза 5%', dosage: '400 мл', form: 'раствор для инфузий' },
        schedule: { 
          frequency: 'once_daily', 
          startDate: '2025-12-12', 
          endDate: '2025-12-13',
          startTime: '11:00',
          times: ['11:00'],
          relationToMeal: 'В любое время'
        },
        nextDue: '2025-12-13T11:00:00',
        status: 'pending',
        priority: 'low',
        duration: 60,
        instructions: 'Внутривенная инфузия',
        medicalForm: { route: 'в/в', rate: '40 капель/мин' },
        notes: '',
        createdAt: '2025-12-12T11:00:00',
        createdBy: 'doctor1'
      }
    ]
  },
  {
    id: 4,
    name: "Козлова Мария Владимировна",
    age: 38,
    diagnosis: "Гастрит",
    room: "207",
    status: "stable",
    newsScore: 1,
    vitals: [
      { time: "2025-01-10T08:00:00", temp: 36.6, pulse: 72, bp: "110/70", spo2: 98, rr: 16 },
      { time: "2025-01-10T12:00:00", temp: 36.7, pulse: 75, bp: "115/75", spo2: 97, rr: 17 },
      { time: "2025-01-10T16:00:00", temp: 36.8, pulse: 78, bp: "112/73", spo2: 98, rr: 16 },
      { time: "2025-01-10T20:00:00", temp: 36.6, pulse: 70, bp: "108/68", spo2: 99, rr: 15 },
    ],
    notes: "Состояние удовлетворительное. Назначена диета и медикаментозная терапия.",
    appointments: [
      {
        id: 'app_4_1',
        patientId: 4,
        patientName: "Козлова Мария Владимировна",
        room: "207",
        type: 'medication',
        name: 'Омепразол 20 мг - Таблетки перорально',
        medication: { name: 'Омепразол', dosage: '20 мг', form: 'таблетки' },
        schedule: { 
          frequency: 'once_daily', 
          startDate: '2025-12-12', 
          endDate: '2025-12-19',
          startTime: '08:00',
          times: ['08:00'],
          relationToMeal: 'За 30 минут до еды'
        },
        nextDue: '2025-12-13T08:00:00',
        status: 'pending',
        priority: 'medium',
        duration: 5,
        instructions: 'Принимать утром за 30 минут до завтрака',
        notes: '',
        createdAt: '2025-12-12T08:00:00',
        createdBy: 'doctor1'
      }
    ]
  },
  {
    id: 5,
    name: "Николаев Дмитрий Сергеевич",
    age: 72,
    diagnosis: "Гипертоническая болезнь",
    room: "105",
    status: "warning",
    newsScore: 4,
    vitals: [
      { time: "2025-01-10T08:00:00", temp: 36.9, pulse: 85, bp: "150/95", spo2: 96, rr: 18 },
      { time: "2025-01-10T12:00:00", temp: 37.0, pulse: 88, bp: "145/92", spo2: 95, rr: 19 },
      { time: "2025-01-10T16:00:00", temp: 36.8, pulse: 82, bp: "148/94", spo2: 96, rr: 18 },
      { time: "2025-01-10T20:00:00", temp: 36.7, pulse: 80, bp: "142/90", spo2: 97, rr: 17 },
    ],
    notes: "Артериальная гипертензия. Требуется коррекция терапии. Назначен мониторинг АД.",
    appointments: [
      {
        id: 'app_5_1',
        patientId: 5,
        patientName: "Николаев Дмитрий Сергеевич",
        room: "105",
        type: 'medication',
        name: 'Амлодипин 5 мг - Таблетки перорально',
        medication: { name: 'Амлодипин', dosage: '5 мг', form: 'таблетки' },
        schedule: { 
          frequency: 'once_daily', 
          startDate: '2025-12-12', 
          endDate: '2025-12-19',
          startTime: '09:00',
          times: ['09:00'],
          relationToMeal: 'В любое время'
        },
        nextDue: '2025-12-13T09:00:00',
        status: 'pending',
        priority: 'medium',
        duration: 5,
        instructions: 'Принимать утром',
        notes: 'Контроль АД утром и вечером',
        createdAt: '2025-12-12T09:00:00',
        createdBy: 'doctor1'
      },
      {
        id: 'app_5_2',
        patientId: 5,
        patientName: "Николаев Дмитрий Сергеевич",
        room: "105",
        type: 'observation',
        name: 'Измерение АД',
        schedule: { 
          frequency: 'twice_daily', 
          startDate: '2025-12-12', 
          endDate: '2025-12-15',
          startTime: '08:00',
          times: ['08:00', '20:00'],
          relationToMeal: 'В любое время'
        },
        nextDue: '2025-12-13T08:00:00',
        status: 'pending',
        priority: 'medium',
        duration: 10,
        instructions: 'Измерение артериального давления',
        notes: 'Записать показатели в журнал',
        createdAt: '2025-12-12T08:00:00',
        createdBy: 'doctor1'
      }
    ]
  }
];