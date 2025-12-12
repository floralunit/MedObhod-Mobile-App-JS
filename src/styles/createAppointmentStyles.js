import { StyleSheet } from 'react-native';

export const createAppointmentStyles = StyleSheet.create({
  // Типы назначений
  templateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  templateButton: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateButtonText: {
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  templateDuration: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.8,
  },

  // Лекарства
  medicationContainer: {
    marginTop: 10,
  },
  medicationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  medicationButton: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  medicationButtonSelected: {
    backgroundColor: '#007aff',
    borderColor: '#0056b3',
  },
  medicationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  medicationButtonTextSelected: {
    color: '#fff',
  },
  medicationDetails: {
    marginTop: 5,
  },
  medicationDosage: {
    fontSize: 12,
    color: '#666',
  },
  medicationForm: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  categoryBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 9,
    color: '#666',
  },

  // Расписание
  scheduleContainer: {
    marginTop: 20,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  frequencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    minWidth: 100,
  },
  frequencyButtonSelected: {
    backgroundColor: '#007aff',
  },
  frequencyButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  frequencyButtonTextSelected: {
    color: '#fff',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlotInput: {
    flex: 1,
    minWidth: 100,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  timeSlotLabel: {
    fontSize: 14,
    color: '#666',
    minWidth: 60,
  },
  timeSlotRemove: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSlotRemoveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  addTimeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  addTimeText: {
    color: '#007aff',
    fontSize: 14,
    fontWeight: '500',
  },
  relationToMealContainer: {
    marginTop: 15,
  },
  relationToMealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  relationToMealButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  relationToMealButtonSelected: {
    backgroundColor: '#28a745',
  },
  relationToMealText: {
    fontSize: 12,
    fontWeight: '500',
  },
  relationToMealTextSelected: {
    color: '#fff',
  },

  // Продолжительность
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  durationInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  durationLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },

  // Приоритет
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  priorityButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },

  // Кнопки действий
  actionButtons: {
    flexDirection: 'row',
    marginTop: 30,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    marginRight: 10,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#28a745',
  },

  // Препарат с ручным вводом
  customMedicationContainer: {
    marginTop: 15,
  },
  customMedicationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dosageInput: {
    flex: 1,
  },
  formInput: {
    flex: 1,
  },

  // Инструкции
  instructionsContainer: {
    marginTop: 15,
  },
  instructionInput: {
    height: 100,
    textAlignVertical: 'top',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  // Медицинская форма
  medicalFormContainer: {
    marginTop: 15,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  formInputHalf: {
    flex: 1,
  },
  formInputFull: {
    flex: 1,
  },
});