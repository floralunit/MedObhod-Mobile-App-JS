import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import SimpleChart from '../components/SimpleChart';
import { globalStyles } from '../styles/globalStyles';

// Периоды фильтрации
const PERIODS = {
  ALL: 'all',
  DAY: 'day',
  THREE_DAYS: 'three_days',
  WEEK: 'week',
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

export default function VitalsChartScreen({ route, navigation }) {
  const { vitals, patientName, patientId } = route.params || {};
  
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS.ALL);
  const [selectedMetric, setSelectedMetric] = useState('temp');
  const [filteredData, setFilteredData] = useState([]);
  const [normalRange, setNormalRange] = useState({ min: 0, max: 0 });
  const [loading, setLoading] = useState(true);

  // Метрики для отображения
  const metrics = [
    { key: 'temp', label: 'Температура', unit: '°C', color: '#FF6B6B' },
    { key: 'pulse', label: 'Пульс', unit: 'уд/мин', color: '#4ECDC4' },
    { key: 'bp_sys', label: 'АД Сист.', unit: 'мм рт.ст.', color: '#45B7D1' },
    { key: 'bp_dia', label: 'АД Диаст.', unit: 'мм рт.ст.', color: '#96CEB4' },
    { key: 'spo2', label: 'SpO₂', unit: '%', color: '#FFEAA7' },
    { key: 'rr', label: 'ЧДД', unit: 'в мин', color: '#DDA0DD' },
  ];

  // Нормальные диапазоны для метрик
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
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  }, [vitals, selectedPeriod]);

  // Обновление нормального диапазона
  useEffect(() => {
    if (selectedMetric in normalRanges) {
      setNormalRange(normalRanges[selectedMetric]);
    }
  }, [selectedMetric]);

  // Получение данных для графика
  const getChartData = () => {
    if (!filteredData || filteredData.length === 0) {
      return [];
    }

    return filteredData.map((item, index) => {
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

  // Получение статистики
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

  const chartData = getChartData();
  const statistics = getStatistics();
  const selectedMetricInfo = metrics.find(m => m.key === selectedMetric);

  // Рендер содержимого
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={styles.loadingText}>Загрузка данных...</Text>
        </View>
      );
    }

    if (!vitals || vitals.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Нет данных о показателях</Text>
          <Text style={styles.emptyText}>Для этого пациента нет записей о витальных показателях</Text>
        </View>
      );
    }

    return (
      <>
        {/* График */}
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

        {/* Статистика */}
        {statistics && (
          <View style={[globalStyles.card, { marginTop: 20 }]}>
            <Text style={globalStyles.subtitle}>Статистика</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Текущее</Text>
                <Text style={[styles.statValue, { color: statistics.isNormal ? '#28a745' : '#dc3545' }]}>
                  {statistics.lastValue} {selectedMetricInfo?.unit}
                </Text>
                <Text style={[styles.statStatus, { color: statistics.isNormal ? '#28a745' : '#dc3545' }]}>
                  {statistics.isNormal ? '✓ В норме' : '⚠ Отклонение'}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Норма</Text>
                <Text style={styles.statValue}>
                  {normalRange.min} - {normalRange.max} {selectedMetricInfo?.unit}
                </Text>
                <Text style={styles.statStatus}>Диапазон</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Минимум</Text>
                <Text style={styles.statValue}>
                  {statistics.min} {selectedMetricInfo?.unit}
                </Text>
                <Text style={styles.statStatus}>За период</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Максимум</Text>
                <Text style={styles.statValue}>
                  {statistics.max} {selectedMetricInfo?.unit}
                </Text>
                <Text style={styles.statStatus}>За период</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Среднее</Text>
                <Text style={styles.statValue}>
                  {statistics.avg} {selectedMetricInfo?.unit}
                </Text>
                <Text style={styles.statStatus}>За период</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Измерений</Text>
                <Text style={styles.statValue}>{statistics.count}</Text>
                <Text style={styles.statStatus}>Всего</Text>
              </View>
            </View>
          </View>
        )}

        {/* Таблица измерений */}
        {filteredData.length > 0 && (
          <View style={[globalStyles.card, { marginTop: 20, marginBottom: 30 }]}>
            <Text style={globalStyles.subtitle}>История измерений</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Время</Text>
                <Text style={styles.tableHeaderCell}>Значение</Text>
                <Text style={styles.tableHeaderCell}>Статус</Text>
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
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{formatDate(item.time)}</Text>
                    <Text style={styles.tableCell}>
                      {value.toFixed(1)} {selectedMetricInfo?.unit}
                    </Text>
                    <View style={[styles.statusBadge, { 
                      backgroundColor: isNormalValue ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)' 
                    }]}>
                      <Text style={[styles.statusText, { 
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
        {/* Заголовок */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Динамика показателей</Text>
          <Text style={styles.patientName}>{patientName || 'Пациент'}</Text>
        </View>

        {/* Фильтры периода */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Период:</Text>
          <View style={styles.periodButtons}>
            {Object.entries({
              [PERIODS.DAY]: 'Сутки',
              [PERIODS.THREE_DAYS]: '3 дня',
              [PERIODS.WEEK]: 'Неделя',
              [PERIODS.ALL]: 'Всё время',
            }).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.periodButton,
                  selectedPeriod === key && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(key)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === key && styles.periodButtonTextActive,
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Выбор метрики */}
        <View style={styles.metricsContainer}>
          <Text style={styles.filterLabel}>Показатель:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsScroll}>
            <View style={styles.metricsList}>
              {metrics.map((metric) => (
                <TouchableOpacity
                  key={metric.key}
                  style={[
                    styles.metricButton,
                    selectedMetric === metric.key && { backgroundColor: metric.color },
                  ]}
                  onPress={() => setSelectedMetric(metric.key)}
                >
                  <Text style={[
                    styles.metricButtonText,
                    selectedMetric === metric.key && styles.metricButtonTextActive,
                  ]}>
                    {metric.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Основное содержимое */}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#007aff',
    fontSize: 16,
    fontWeight: '500',
  },
  patientName: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#007aff',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  metricsContainer: {
    marginBottom: 20,
  },
  metricsScroll: {
    maxHeight: 50,
  },
  metricsList: {
    flexDirection: 'row',
    gap: 8,
  },
  metricButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  metricButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  metricButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  statItem: {
    width: '31%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statStatus: {
    fontSize: 11,
    fontWeight: '500',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: '600',
    color: '#333',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
};