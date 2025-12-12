import { StyleSheet } from 'react-native';

export const headDepartmentStyles = StyleSheet.create({
  // Заголовок
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  // Вкладки
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#007aff',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#007aff',
  },

  // Контент
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Статистика
  statsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007aff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Списки
  listContainer: {
    marginTop: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Карточка врача
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  doctorRole: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  doctorStats: {
    flexDirection: 'row',
  },
  statMini: {
    alignItems: 'center',
    marginRight: 16,
  },
  statMiniValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007aff',
  },
  statMiniLabel: {
    fontSize: 10,
    color: '#666',
  },
  doctorActionButton: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  doctorActionButtonText: {
    fontSize: 20,
    color: '#666',
  },

  // Карточка медсестры
  nurseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nurseAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17a2b8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nurseAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nurseInfo: {
    flex: 1,
  },
  nurseName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  nurseRole: {
    fontSize: 12,
    color: '#666',
  },
  nurseStatusBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nurseStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },

  // Аналитика
  analyticsContainer: {
    marginTop: 20,
  },
  kpiCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kpiTrend: {
    fontSize: 12,
    color: '#28a745', // зеленый для позитивного тренда
  },

  // Отчеты
  reportsContainer: {
    marginTop: 20,
  },
  reportCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reportIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 12,
    color: '#666',
  },

  // Быстрая кнопка
  quickActionButton: {
    margin: 16,
    backgroundColor: '#007aff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Модальное окно
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  modalCancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  modalSaveButton: {
    backgroundColor: '#007aff',
    marginLeft: 8,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});