import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 60;
const CHART_HEIGHT = 200;
const POINT_RADIUS = 5;
const PADDING = 20;

const SimpleChart = ({ data, normalRange, color = '#007aff', unit = '' }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Нет данных для отображения</Text>
      </View>
    );
  }

  // Извлекаем значения
  const values = data.map(item => item.value);
  const labels = data.map(item => item.label || '');

  // Находим мин и макс для масштабирования
  const minValue = Math.min(...values, normalRange?.min || 0);
  const maxValue = Math.max(...values, normalRange?.max || 100);
  const valueRange = maxValue - minValue || 1;

  // Масштабируем значения для графика
  const scaleY = (value) => {
    return CHART_HEIGHT - ((value - minValue) / valueRange) * (CHART_HEIGHT - PADDING * 2) - PADDING;
  };

  const scaleX = (index) => {
    return (index / (data.length - 1)) * (CHART_WIDTH - PADDING * 2) + PADDING;
  };

  // Создаем точки для графика
  const points = data.map((item, index) => ({
    x: scaleX(index),
    y: scaleY(item.value),
    value: item.value,
    label: labels[index],
  }));

  // Рисуем линии между точками
  const renderLines = () => {
    const lines = [];
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      lines.push(
        <View
          key={`line-${i}`}
          style={[
            styles.line,
            {
              left: current.x,
              top: current.y,
              width: Math.sqrt(Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2)),
              transform: [
                { rotate: `${Math.atan2(next.y - current.y, next.x - current.x)}rad` },
              ],
              backgroundColor: color,
            },
          ]}
        />
      );
    }
    return lines;
  };

  // Рендерим точки
  const renderPoints = () => {
    return points.map((point, index) => {
      // Определяем цвет точки в зависимости от нормального диапазона
      let pointColor = '#28a745'; // зеленый - норма
      if (normalRange) {
        if (point.value < normalRange.min) {
          pointColor = '#007aff'; // синий - ниже нормы
        } else if (point.value > normalRange.max) {
          pointColor = '#dc3545'; // красный - выше нормы
        }
      }

      return (
        <View key={`point-${index}`}>
          {/* Точка */}
          <View
            style={[
              styles.point,
              {
                left: point.x - POINT_RADIUS,
                top: point.y - POINT_RADIUS,
                backgroundColor: pointColor,
                borderColor: color,
              },
            ]}
          />
          
          {/* Подпись значения для каждой 2-й точки */}
          {index % 2 === 0 && (
            <Text
              style={[
                styles.pointLabel,
                {
                  left: point.x - 15,
                  top: point.y - 25,
                },
              ]}
            >
              {point.value.toFixed(1)}
            </Text>
          )}
          
          {/* Подпись времени для каждой 3-й точки */}
          {index % 3 === 0 && index !== 0 && index !== points.length - 1 && (
            <Text
              style={[
                styles.xLabel,
                {
                  left: point.x - 15,
                  top: CHART_HEIGHT + 10,
                },
              ]}
            >
              {point.label}
            </Text>
          )}
        </View>
      );
    });
  };

  // Рисуем нормальный диапазон
  const renderNormalRange = () => {
    if (!normalRange) return null;
    
    const minY = scaleY(normalRange.max);
    const maxY = scaleY(normalRange.min);
    const rangeHeight = maxY - minY;
    
    return (
      <View
        style={[
          styles.normalRange,
          {
            top: minY,
            height: rangeHeight,
          },
        ]}
      />
    );
  };

  // Рисуем оси и метки
  const renderAxis = () => {
    const yAxisLabels = [];
    const stepCount = 5;
    
    for (let i = 0; i <= stepCount; i++) {
      const value = minValue + (valueRange * i) / stepCount;
      const y = scaleY(value);
      
      yAxisLabels.push(
        <View key={`y-label-${i}`} style={[styles.yLabelContainer, { top: y - 10 }]}>
          <Text style={styles.yLabelText}>{value.toFixed(1)} {unit}</Text>
        </View>
      );
    }
    
    return (
      <>
        {/* Ось Y */}
        <View style={styles.yAxis} />
        {yAxisLabels}
        
        {/* Ось X */}
        <View style={styles.xAxis} />
        
        {/* Начальная и конечная метки времени */}
        {points.length > 0 && (
          <>
            <Text style={[styles.xLabel, { left: PADDING - 10, top: CHART_HEIGHT + 10 }]}>
              {points[0].label}
            </Text>
            <Text style={[styles.xLabel, { left: CHART_WIDTH - PADDING - 10, top: CHART_HEIGHT + 10 }]}>
              {points[points.length - 1].label}
            </Text>
          </>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {renderNormalRange()}
        {renderLines()}
        {renderPoints()}
        {renderAxis()}
      </View>
      
      {/* Легенда */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.legendText}>Показатель</Text>
        </View>
        {normalRange && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(40, 167, 69, 0.2)' }]} />
            <Text style={styles.legendText}>Нормальный диапазон</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  chartContainer: {
    width: CHART_WIDTH + PADDING * 2,
    height: CHART_HEIGHT + PADDING * 2,
    position: 'relative',
  },
  normalRange: {
    position: 'absolute',
    left: PADDING,
    right: PADDING,
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(40, 167, 69, 0.3)',
  },
  line: {
    position: 'absolute',
    height: 2,
    transformOrigin: '0% 0%',
  },
  point: {
    position: 'absolute',
    width: POINT_RADIUS * 2,
    height: POINT_RADIUS * 2,
    borderRadius: POINT_RADIUS,
    borderWidth: 2,
  },
  pointLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  yAxis: {
    position: 'absolute',
    left: PADDING,
    top: PADDING,
    bottom: PADDING,
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  xAxis: {
    position: 'absolute',
    left: PADDING,
    right: PADDING,
    bottom: PADDING,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  yLabelContainer: {
    position: 'absolute',
    left: 0,
    width: PADDING - 5,
    alignItems: 'flex-end',
  },
  yLabelText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  xLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#666',
    transform: [{ rotate: '-45deg' }],
    transformOrigin: 'left top',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});

export default SimpleChart;