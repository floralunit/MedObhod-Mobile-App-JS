import { StyleSheet } from 'react-native';

export const patientCardStyles = StyleSheet.create({
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  newAppointmentButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newAppointmentButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  appointmentsSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  urgentAppointment: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffcccc',
    borderWidth: 1,
  },
  completedAppointment: {
    opacity: 0.7,
    backgroundColor: '#f8f9fa',
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  appointmentDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  appointmentTime: {
    fontSize: 12,
    color: '#007aff',
    marginTop: 2,
    fontWeight: '500',
  },
  appointmentInstruction: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  appointmentMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  urgentBadge: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  completedText: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noAppointments: {
    alignItems: 'center',
    padding: 30,
  },
  noAppointmentsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noAppointmentsText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  createFirstButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});