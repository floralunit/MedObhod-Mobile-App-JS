export const HOSPITAL_CONFIG = {
  // Временные слоты (позже будут настраиваться админом)
  MEAL_TIMES: {
    BREAKFAST: '08:00',
    LUNCH: '13:00',
    DINNER: '18:00',
    NIGHT_SNACK: '22:00'
  },
  
  ROUND_TIMES: {
    MORNING_ROUND: '09:00',
    DAY_ROUND: '14:00',
    EVENING_ROUND: '19:00',
    NIGHT_ROUND: '02:00'
  },
  
  // Периоды приема лекарств относительно еды
  MEDICATION_TIMES: {
    BEFORE_MEAL: 'За 30 минут до еды',
    WITH_MEAL: 'Во время еды',
    AFTER_MEAL: 'Через 30 минут после еды',
    ON_EMPTY_STOMACH: 'Натощак',
    BEFORE_SLEEP: 'Перед сном',
    ANY_TIME: 'В любое время'
  },
  
  // Частоты приема
  FREQUENCIES: {
    ONCE_DAILY: { id: 'once_daily', label: '1 раз в день' },
    TWICE_DAILY: { id: 'twice_daily', label: '2 раза в день' },
    THREE_TIMES_DAILY: { id: 'three_times_daily', label: '3 раза в дня' },
    FOUR_TIMES_DAILY: { id: 'four_times_daily', label: '4 раза в день' },
    EVERY_6_HOURS: { id: 'every_6h', label: 'Каждые 6 часов' },
    EVERY_8_HOURS: { id: 'every_8h', label: 'Каждые 8 часов' },
    EVERY_12_HOURS: { id: 'every_12h', label: 'Каждые 12 часов' },
    EVERY_24_HOURS: { id: 'every_24h', label: 'Раз в сутки' },
    AS_NEEDED: { id: 'as_needed', label: 'По требованию' },
    STAT: { id: 'stat', label: 'Срочно (однократно)' }
  },
  
  // Типы назначений
  APPOINTMENT_TYPES: {
    MEDICATION: 'medication',
    INJECTION: 'injection',
    IV_DRIP: 'iv_drip',
    PROCEDURE: 'procedure',
    EXAMINATION: 'examination',
    CONSULTATION: 'consultation',
    DRESSING: 'dressing',
    PHYSIOTHERAPY: 'physiotherapy',
    LAB_TEST: 'lab_test',
    DIET: 'diet',
    OBSERVATION: 'observation'
  }
};