import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RoundContext = createContext();

export const RoundProvider = ({ children }) => {
  const [activeRound, setActiveRound] = useState(null);
  const [roundPatients, setRoundPatientsState] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Загрузка активного обхода при старте
  useEffect(() => {
    loadActiveRound();
  }, []);

  const loadActiveRound = async () => {
    try {
      const savedRound = await AsyncStorage.getItem('activeRound');
      if (savedRound) {
        const round = JSON.parse(savedRound);

        // Проверяем, что у пациентов есть имена
        const hasValidPatients = round.patients &&
          round.patients.length > 0 &&
          round.patients.every(p => p && p.name && p.name !== 'Unknown' && p.name !== 'undefined');

        if (!hasValidPatients) {
          console.log('Round has invalid patient data, clearing...');
          await AsyncStorage.removeItem('activeRound');
          return;
        }

        setActiveRound(round);
        setRoundPatientsState(round.patients);
      }
    } catch (error) {
      console.error('Failed to load active round:', error);
      await AsyncStorage.removeItem('activeRound');
    }
  };

  const startRound = (round, patients) => {

    const roundWithFullData = {
      ...round,
      patients: patients.map(p => ({
        id: p.id,
        name: p.name || 'Пациент',
        age: p.age || 0,
        room: p.room || '?',
        diagnosis: p.diagnosis || 'Не указан',
        status: p.status || 'stable',
        newsScore: p.newsScore || 0,
        hospitalizationId: p.hospitalizationId,
        visited: p.visited || false
      }))
    };

    setActiveRound(roundWithFullData);
    setRoundPatientsState(roundWithFullData.patients);
    setCurrentIndex(0);
    AsyncStorage.setItem('activeRound', JSON.stringify(roundWithFullData));
  };

  const nextPatient = () => {
    if (currentIndex < roundPatients.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return true;
    }
    return false;
  };

  const previousPatient = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return true;
    }
    return false;
  };

  const goToPatient = (index) => {
    if (index >= 0 && index < roundPatients.length) {
      setCurrentIndex(index);
      return true;
    }
    return false;
  };

  const completeRound = async () => {
    setActiveRound(null);
    setRoundPatientsState([]);
    setCurrentIndex(0);
    await AsyncStorage.removeItem('activeRound');
  };

  const getCurrentPatient = () => {
    return roundPatients[currentIndex];
  };

  const getProgress = () => {
    return {
      current: currentIndex + 1,
      total: roundPatients.length
    };
  };

  const updatePatientVisitStatus = (patientId, isVisited) => {
    setRoundPatientsState(prev =>
      prev.map(p =>
        p.id === patientId ? { ...p, visited: isVisited } : p
      )
    );

    if (activeRound) {
      const updatedPatients = activeRound.patients.map(p =>
        p.id === patientId ? { ...p, visited: isVisited } : p
      );
      const updatedRound = { ...activeRound, patients: updatedPatients };
      setActiveRound(updatedRound);
      AsyncStorage.setItem('activeRound', JSON.stringify(updatedRound));
    }
  };

  const setRoundPatients = (patients) => {
    setRoundPatientsState(patients);
  };

  return (
    <RoundContext.Provider value={{
      activeRound,
      roundPatients,
      currentIndex,
      startRound,
      nextPatient,
      previousPatient,
      goToPatient,
      completeRound,
      getCurrentPatient,
      getProgress,
      updatePatientVisitStatus,
      setRoundPatients
    }}>
      {children}
    </RoundContext.Provider>
  );
};

export const useRound = () => {
  const context = useContext(RoundContext);
  if (!context) {
    throw new Error('useRound must be used within RoundProvider');
  }
  return context;
};