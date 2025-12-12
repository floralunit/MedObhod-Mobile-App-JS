import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const doctorRouteStyles = StyleSheet.create({
  // Заголовок
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  statsButtonText: {
    fontSize: 14,
    color: '#007aff',
    fontWeight: '500',
  },

  // Фильтры
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersScrollContent: {
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007aff',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Список пациентов
  patientListContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  patientListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  patientListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#f9f9f9',
  },
  patientListItemActive: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#007aff',
  },
  listPatientInfo: {
    flex: 1,
  },
  listPatientName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  listPatientRoom: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  listPatientStatus: {
    alignItems: 'flex-end',
  },

  // Основная карта пациента
  mainCardContainer: {
    flex: 1,
    padding: 16,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  patientStatusContainer: {
    alignItems: 'flex-end',
  },

  // Бейджи
  newsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  newsText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },

  // Диагноз
  diagnosisContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  diagnosisLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  diagnosisText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },

  // Витальные показатели
  vitalsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vitalItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  noVitalsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },

  // Тренды
  trendContainer: {
    backgroundColor: '#fff8f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e65100',
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trendLabel: {
    fontSize: 14,
    color: '#666',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },

  // Назначения
  appointmentsContainer: {
    marginBottom: 16,
  },
  appointmentItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appointmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  appointmentInstructions: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 12,
    color: '#007aff',
  },
  noAppointments: {
    padding: 16,
    alignItems: 'center',
  },
  noAppointmentsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },

  // Заметки
  notesContainer: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  // Прогресс
  progressContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
  },

  // Кнопки действий
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  noteButton: {
    backgroundColor: '#ffc107',
  },
  appointmentButton: {
    backgroundColor: '#007aff',
  },
  completeButton: {
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Состояния без данных
  noPatients: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noPatientsText: {
    fontSize: 16,
    color: '#999',
  },
});