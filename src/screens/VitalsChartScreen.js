import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import SimpleChart from '../components/SimpleChart';
import { globalStyles } from '../styles/globalStyles';
import { vitalsChartStyles } from '../styles/vitalsChartStyles';
import { getVitalSigns, addVitalSign } from '../services/vitalSignsSyncService';
import { useUser } from '../context/UserContext';

// Периоды фильтрации
const PERIODS = {
  ALL: 'all',
  DAY: 'day',
  THREE_DAYS: 'three_days',
  WEEK: 'week',
};

// ШАБЛОН НОРМАЛЬНЫХ ПОКАЗАТЕЛЕЙ
const DEFAULT_VITALS = {
  temperature: '36.6',
  pulse: '72',
  systolicBP: '120',
  diastolicBP: '80',
  spo2: '98',
  respiratoryRate: '16',
};

// Утилиты для работы с датами
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--:--';
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return '--:--';
  }
};

const formatDateShort = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--:--';
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return '--:--';
  }
};

// Получение текущей даты в формате для input
const getCurrentDateTimeForInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Получение начальных данных формы
const getInitialFormData = () => ({
  temperature: DEFAULT_VITALS.temperature,
  pulse: DEFAULT_VITALS.pulse,
  systolicBP: DEFAULT_VITALS.systolicBP,
  diastolicBP: DEFAULT_VITALS.diastolicBP,
  spo2: DEFAULT_VITALS.spo2,
  respiratoryRate: DEFAULT_VITALS.respiratoryRate,
  measuredAt: getCurrentDateTimeForInput()
});

export default function VitalsChartScreen({ route, navigation }) {
  const { patientId, patientName, hospitalizationId } = route.params || {};
  const { user } = useUser();

  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS.ALL);
  const [selectedMetric, setSelectedMetric] = useState('temp');
  const [vitals, setVitals] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [normalRange, setNormalRange] = useState({ min: 0, max: 0 });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Форма добавления показателя - ИСПОЛЬЗУЕМ ШАБЛОН
  const [formData, setFormData] = useState(getInitialFormData());

  // Загрузка данных
  useEffect(() => {
    loadVitals();
  }, [hospitalizationId]);

  const loadVitals = () => {
    setLoading(true);
    try {
      if (hospitalizationId) {
        const vitalsData = getVitalSigns(hospitalizationId);
        console.log('Loaded vitals for chart:', vitalsData.length);
        setVitals(vitalsData);
      }
    } catch (error) {
      console.error('Failed to load vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  // ОТКРЫТИЕ МОДАЛЬНОГО ОКНА С ПРЕДЗАПОЛНЕННЫМИ ДАННЫМИ
  const openAddVitalModal = () => {
    // Если есть предыдущие показатели, используем их как шаблон
    if (vitals && vitals.length > 0) {
      const lastVital = vitals[0]; // Последние показатели
      setFormData({
        temperature: lastVital.temp?.toString() || DEFAULT_VITALS.temperature,
        pulse: lastVital.pulse?.toString() || DEFAULT_VITALS.pulse,
        systolicBP: lastVital.systolicBP?.toString() || DEFAULT_VITALS.systolicBP,
        diastolicBP: lastVital.diastolicBP?.toString() || DEFAULT_VITALS.diastolicBP,
        spo2: lastVital.spo2?.toString() || DEFAULT_VITALS.spo2,
        respiratoryRate: lastVital.rr?.toString() || DEFAULT_VITALS.respiratoryRate,
        measuredAt: getCurrentDateTimeForInput()
      });
    } else {
      // Иначе используем значения по умолчанию
      setFormData(getInitialFormData());
    }
    setModalVisible(true);
  };

  // Метрики для отображения
  const metrics = [
    { key: 'temp', label: 'Температура', unit: '°C', color: '#FF6B6B', defaultValue: DEFAULT_VITALS.temperature },
    { key: 'pulse', label: 'Пульс', unit: 'уд/мин', color: '#4ECDC4', defaultValue: DEFAULT_VITALS.pulse },
    { key: 'bp_sys', label: 'АД Сист.', unit: 'мм рт.ст.', color: '#45B7D1', defaultValue: DEFAULT_VITALS.systolicBP },
    { key: 'bp_dia', label: 'АД Диаст.', unit: 'мм рт.ст.', color: '#96CEB4', defaultValue: DEFAULT_VITALS.diastolicBP },
    { key: 'spo2', label: 'SpO₂', unit: '%', color: '#FFEAA7', defaultValue: DEFAULT_VITALS.spo2 },
    { key: 'rr', label: 'ЧДД', unit: 'в мин', color: '#DDA0DD', defaultValue: DEFAULT_VITALS.respiratoryRate },
  ];

  // Нормальные диапазоны
  const normalRanges = {
    temp: { min: 36.1, max: 37.2 },
    pulse: { min: 60, max: 100 },
    bp_sys: { min: 90, max: 140 },
    bp_dia: { min: 60, max: 90 },
    spo2: { min: 94, max: 100 },
    rr: { min: 12, max: 20 },
  };

  // Фильтрация данных
  useEffect(() => {
    if (!vitals || vitals.length === 0) {
      setFilteredData([]);
      return;
    }

    try {
      const now = new Date();
      let filtered = [...vitals].sort((a, b) => {
        const dateA = new Date(a.time || Date.now());
        const dateB = new Date(b.time || Date.now());
        return dateA - dateB;
      });

      switch (selectedPeriod) {
        case PERIODS.DAY:
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          filtered = filtered.filter(item => new Date(item.time) >= oneDayAgo);
          break;
        case PERIODS.THREE_DAYS:
          const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(item => new Date(item.time) >= threeDaysAgo);
          break;
        case PERIODS.WEEK:
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(item => new Date(item.time) >= weekAgo);
          break;
        default:
          break;
      }

      setFilteredData(filtered);
    } catch (error) {
      console.error('Error filtering data:', error);
      setFilteredData(vitals || []);
    }
  }, [vitals, selectedPeriod]);

  useEffect(() => {
    if (selectedMetric in normalRanges) {
      setNormalRange(normalRanges[selectedMetric]);
    }
  }, [selectedMetric]);

  const getChartData = () => {
    if (!filteredData || filteredData.length === 0) return [];

    return filteredData.map((item) => {
      let value;
      if (selectedMetric === 'bp_sys' || selectedMetric === 'bp_dia') {
        const [sys, dia] = (item.bp || '120/80').split('/').map(Number);
        value = selectedMetric === 'bp_sys' ? sys : dia;
      } else {
        value = parseFloat(item[selectedMetric] || 0);
      }
      return {
        value: isNaN(value) ? 0 : value,
        label: formatDateShort(item.time),
        originalData: item,
      };
    });
  };

  const getStatistics = () => {
    if (!filteredData || filteredData.length === 0) return null;

    try {
      let values = [];
      if (selectedMetric === 'bp_sys' || selectedMetric === 'bp_dia') {
        values = filteredData.map(item => {
          const [sys, dia] = (item.bp || '120/80').split('/').map(Number);
          return selectedMetric === 'bp_sys' ? sys : dia;
        });
      } else {
        values = filteredData.map(item => parseFloat(item[selectedMetric] || 0));
      }

      const validValues = values.filter(v => !isNaN(v));
      if (validValues.length === 0) return null;

      const min = Math.min(...validValues).toFixed(1);
      const max = Math.max(...validValues).toFixed(1);
      const sum = validValues.reduce((a, b) => a + b, 0);
      const avg = (sum / validValues.length).toFixed(1);
      const lastValue = validValues[validValues.length - 1];
      const isNormal = lastValue >= normalRange.min && lastValue <= normalRange.max;

      return { min, max, avg, lastValue, isNormal, count: validValues.length };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return null;
    }
  };

  const handleSaveVital = async () => {
    const hasData = formData.temperature || formData.pulse ||
      formData.systolicBP || formData.spo2 || formData.respiratoryRate;

    if (!hasData) {
      Alert.alert('Ошибка', 'Заполните хотя бы один показатель');
      return;
    }

    setSaving(true);
    try {
      const vitalData = {
        hospitalizationId: hospitalizationId,
        measuredAt: new Date(formData.measuredAt).toISOString(),
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        pulse: formData.pulse ? parseInt(formData.pulse) : null,
        systolicBP: formData.systolicBP ? parseInt(formData.systolicBP) : null,
        diastolicBP: formData.diastolicBP ? parseInt(formData.diastolicBP) : null,
        spo2: formData.spo2 ? parseInt(formData.spo2) : null,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : null,
        userId: user?.id
      };

      const result = await addVitalSign(vitalData);
      loadVitals();

      setModalVisible(false);

    } catch (error) {
      console.error('Failed to save vital:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить показатели');
    } finally {
      setSaving(false);
    }
  };

  // Закрытие модального окна без сохранения
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const chartData = getChartData();
  const statistics = getStatistics();
  const selectedMetricInfo = metrics.find(m => m.key === selectedMetric);

  // Функция renderContent
  const renderContent = () => {
    if (loading) {
      return (
        <View style={vitalsChartStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={vitalsChartStyles.loadingText}>Загрузка данных...</Text>
        </View>
      );
    }

    if (!vitals || vitals.length === 0) {
      return (
        <View style={vitalsChartStyles.emptyContainer}>
          <Text style={vitalsChartStyles.emptyIcon}>📊</Text>
          <Text style={vitalsChartStyles.emptyTitle}>Нет данных о показателях</Text>
          <Text style={vitalsChartStyles.emptyText}>Для этого пациента нет записей о витальных показателях</Text>
        </View>
      );
    }

    return (
      <>
        <View style={globalStyles.card}>
          <Text style={globalStyles.subtitle}>
            {selectedMetricInfo?.label || 'График'} ({selectedPeriod === PERIODS.DAY ? 'Сутки' :
              selectedPeriod === PERIODS.THREE_DAYS ? '3 дня' :
                selectedPeriod === PERIODS.WEEK ? 'Неделя' : 'Всё время'})
          </Text>

          <SimpleChart
            data={chartData}
            normalRange={normalRange}
            color={selectedMetricInfo?.color || '#007aff'}
            unit={selectedMetricInfo?.unit || ''}
          />
        </View>

        {statistics && (
          <View style={[globalStyles.card, { marginTop: 20 }]}>
            <Text style={globalStyles.subtitle}>Статистика</Text>
            <View style={vitalsChartStyles.statsGrid}>
              <View style={vitalsChartStyles.statItem}>
                <Text style={vitalsChartStyles.statLabel}>Текущее</Text>
                <Text style={[vitalsChartStyles.statValue, { color: statistics.isNormal ? '#28a745' : '#dc3545' }]}>
                  {statistics.lastValue} {selectedMetricInfo?.unit}
                </Text>
                <Text style={[vitalsChartStyles.statStatus, { color: statistics.isNormal ? '#28a745' : '#dc3545' }]}>
                  {statistics.isNormal ? '✓ В норме' : '⚠ Отклонение'}
                </Text>
              </View>

              <View style={vitalsChartStyles.statItem}>
                <Text style={vitalsChartStyles.statLabel}>Норма</Text>
                <Text style={vitalsChartStyles.statValue}>
                  {normalRange.min} - {normalRange.max} {selectedMetricInfo?.unit}
                </Text>
                <Text style={vitalsChartStyles.statStatus}>Диапазон</Text>
              </View>

              <View style={vitalsChartStyles.statItem}>
                <Text style={vitalsChartStyles.statLabel}>Минимум</Text>
                <Text style={vitalsChartStyles.statValue}>
                  {statistics.min} {selectedMetricInfo?.unit}
                </Text>
                <Text style={vitalsChartStyles.statStatus}>За период</Text>
              </View>

              <View style={vitalsChartStyles.statItem}>
                <Text style={vitalsChartStyles.statLabel}>Максимум</Text>
                <Text style={vitalsChartStyles.statValue}>
                  {statistics.max} {selectedMetricInfo?.unit}
                </Text>
                <Text style={vitalsChartStyles.statStatus}>За период</Text>
              </View>

              <View style={vitalsChartStyles.statItem}>
                <Text style={vitalsChartStyles.statLabel}>Среднее</Text>
                <Text style={vitalsChartStyles.statValue}>
                  {statistics.avg} {selectedMetricInfo?.unit}
                </Text>
                <Text style={vitalsChartStyles.statStatus}>За период</Text>
              </View>

              <View style={vitalsChartStyles.statItem}>
                <Text style={vitalsChartStyles.statLabel}>Измерений</Text>
                <Text style={vitalsChartStyles.statValue}>{statistics.count}</Text>
                <Text style={vitalsChartStyles.statStatus}>Всего</Text>
              </View>
            </View>
          </View>
        )}

        {filteredData.length > 0 && (
          <View style={[globalStyles.card, { marginTop: 20, marginBottom: 30 }]}>
            <Text style={globalStyles.subtitle}>История измерений</Text>
            <View style={vitalsChartStyles.table}>
              <View style={vitalsChartStyles.tableHeader}>
                <Text style={vitalsChartStyles.tableHeaderCell}>Время</Text>
                <Text style={vitalsChartStyles.tableHeaderCell}>Значение</Text>
                <Text style={vitalsChartStyles.tableHeaderCell}>Статус</Text>
              </View>

              {filteredData.slice(-10).reverse().map((item, index) => {
                let value;
                if (selectedMetric === 'bp_sys' || selectedMetric === 'bp_dia') {
                  const [sys, dia] = (item.bp || '120/80').split('/').map(Number);
                  value = selectedMetric === 'bp_sys' ? sys : dia;
                } else {
                  value = parseFloat(item[selectedMetric] || 0);
                }

                const isNormalValue = value >= normalRange.min && value <= normalRange.max;

                return (
                  <View key={index} style={vitalsChartStyles.tableRow}>
                    <Text style={vitalsChartStyles.tableCell}>{formatDate(item.time)}</Text>
                    <Text style={vitalsChartStyles.tableCell}>
                      {value.toFixed(1)} {selectedMetricInfo?.unit}
                    </Text>
                    <View style={[vitalsChartStyles.statusBadge, {
                      backgroundColor: isNormalValue ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'
                    }]}>
                      <Text style={[vitalsChartStyles.statusText, {
                        color: isNormalValue ? '#28a745' : '#dc3545'
                      }]}>
                        {isNormalValue ? 'Норма' : 'Отклонение'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <View style={vitalsChartStyles.header}>
          <Text style={globalStyles.title}>Динамика показателей</Text>
          <Text style={vitalsChartStyles.patientName}>{patientName || 'Пациент'}</Text>
        </View>

        {/* Кнопка добавления */}
        <TouchableOpacity
          style={vitalsChartStyles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ fontSize: 18 }}>➕</Text>
          <Text style={vitalsChartStyles.addButtonText}>Добавить показатели</Text>
        </TouchableOpacity>

        <View style={vitalsChartStyles.filterContainer}>
          <Text style={vitalsChartStyles.filterLabel}>Период:</Text>
          <View style={vitalsChartStyles.periodButtons}>
            {Object.entries({
              [PERIODS.DAY]: 'Сутки',
              [PERIODS.THREE_DAYS]: '3 дня',
              [PERIODS.WEEK]: 'Неделя',
              [PERIODS.ALL]: 'Всё время',
            }).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  vitalsChartStyles.periodButton,
                  selectedPeriod === key && vitalsChartStyles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(key)}
              >
                <Text style={[
                  vitalsChartStyles.periodButtonText,
                  selectedPeriod === key && vitalsChartStyles.periodButtonTextActive,
                ]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={vitalsChartStyles.metricsContainer}>
          <Text style={vitalsChartStyles.filterLabel}>Показатель:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={vitalsChartStyles.metricsScroll}>
            <View style={vitalsChartStyles.metricsList}>
              {metrics.map((metric) => (
                <TouchableOpacity
                  key={metric.key}
                  style={[
                    vitalsChartStyles.metricButton,
                    selectedMetric === metric.key && { backgroundColor: metric.color },
                  ]}
                  onPress={() => setSelectedMetric(metric.key)}
                >
                  <Text style={[
                    vitalsChartStyles.metricButtonText,
                    selectedMetric === metric.key && vitalsChartStyles.metricButtonTextActive,
                  ]}>{metric.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {renderContent()}
      </ScrollView>

      {/* Модальное окно для добавления показателей */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={vitalsChartStyles.modalOverlay}>
          <ScrollView style={vitalsChartStyles.modalContent}>
            <Text style={vitalsChartStyles.modalTitle}>Добавить показатели</Text>

            <Text style={vitalsChartStyles.modalLabel}>Температура (°C)</Text>
            <TextInput
              style={vitalsChartStyles.modalInput}
              value={formData.temperature}
              onChangeText={(text) => setFormData({ ...formData, temperature: text })}
              placeholder={DEFAULT_VITALS.temperature}
              keyboardType="numeric"
            />

            <Text style={vitalsChartStyles.modalLabel}>Пульс (уд/мин)</Text>
            <TextInput
              style={vitalsChartStyles.modalInput}
              value={formData.pulse}
              onChangeText={(text) => setFormData({ ...formData, pulse: text })}
              placeholder={DEFAULT_VITALS.pulse}
              keyboardType="numeric"
            />

            <View style={vitalsChartStyles.modalRow}>
              <View style={{ flex: 1 }}>
                <Text style={vitalsChartStyles.modalLabel}>АД сист.</Text>
                <TextInput
                  style={vitalsChartStyles.modalHalfInput}
                  value={formData.systolicBP}
                  onChangeText={(text) => setFormData({ ...formData, systolicBP: text })}
                  placeholder={DEFAULT_VITALS.systolicBP}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={vitalsChartStyles.modalLabel}>АД диаст.</Text>
                <TextInput
                  style={vitalsChartStyles.modalHalfInput}
                  value={formData.diastolicBP}
                  onChangeText={(text) => setFormData({ ...formData, diastolicBP: text })}
                  placeholder={DEFAULT_VITALS.diastolicBP}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={vitalsChartStyles.modalLabel}>SpO₂ (%)</Text>
            <TextInput
              style={vitalsChartStyles.modalInput}
              value={formData.spo2}
              onChangeText={(text) => setFormData({ ...formData, spo2: text })}
              placeholder={DEFAULT_VITALS.spo2}
              keyboardType="numeric"
            />

            <Text style={vitalsChartStyles.modalLabel}>ЧДД (в мин)</Text>
            <TextInput
              style={vitalsChartStyles.modalInput}
              value={formData.respiratoryRate}
              onChangeText={(text) => setFormData({ ...formData, respiratoryRate: text })}
              placeholder={DEFAULT_VITALS.respiratoryRate}
              keyboardType="numeric"
            />

            <View style={vitalsChartStyles.modalButtons}>
              <TouchableOpacity
                style={vitalsChartStyles.modalCancelButton}
                onPress={handleCloseModal}
              >
                <Text style={vitalsChartStyles.modalCancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={vitalsChartStyles.modalSaveButton}
                onPress={handleSaveVital}
                disabled={saving}
              >
                <Text style={vitalsChartStyles.modalSaveButtonText}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}