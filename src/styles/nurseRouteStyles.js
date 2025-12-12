import { StyleSheet, Platform } from 'react-native';

export const nurseRouteStyles = StyleSheet.create({
  // Заголовок с отступами для SafeArea
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Упрощенные фильтры-чипсы
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterChipBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  filterChipBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  
  // Карточка назначения
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  roomText: {
    fontSize: 13,
    color: '#666',
  },
  timeBadge: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007aff',
    marginBottom: 2,
  },
  timeDiff: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
  appointmentBody: {
    marginBottom: 12,
  },
  appointmentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  medicationInfo: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  medicalFormInfo: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
    lineHeight: 18,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  
  // Состояние "пусто"
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  filterChipBadge: {
  backgroundColor: '#007aff',
  borderRadius: 12,
  minWidth: 24,
  height: 24,
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 6,
  paddingHorizontal: 6,
},
filterChipBadgeText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: 'bold',
}
});