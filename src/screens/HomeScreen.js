import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation, route }) {
  //const { role, name } = route.params;
  const role = "doctor";
  const name = "Иванов Иван Иванович";

  const renderMenu = () => {
    switch (role) {
      case "doctor":
        return (
          <>
            <MenuButton title="Обход" onPress={() => {}} />

            <MenuButton
              title="Пациенты"
              onPress={() => navigation.navigate("Patients")}
            />

            <MenuButton title="Назначения" onPress={() => {}} />
          </>
        );

      case "nurse":
        return (
          <>
            <MenuButton title="Назначения" onPress={() => {}} />

            <MenuButton
              title="Пациенты"
              onPress={() => navigation.navigate("Patients")}
            />
          </>
        );

      case "head":
        return (
          <>
            <MenuButton
              title="Пациенты"
              onPress={() => navigation.navigate("Patients")}
            />

            <MenuButton title="Аналитика отделения" onPress={() => {}} />
            <MenuButton title="Сотрудники" onPress={() => {}} />
          </>
        );

      default:
        return <Text>Нет доступных действий</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Добро пожаловать</Text>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.role}>Роль: {role}</Text>

      <View style={{ marginTop: 30 }}>
        {renderMenu()}
      </View>
    </View>
  );
}

// ---------------------
// MenuButton исправленный
// ---------------------

const MenuButton = ({ title, onPress }) => (
  <TouchableOpacity style={styles.menuButton} onPress={onPress}>
    <Text style={styles.menuText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700' },
  name: { fontSize: 20, marginTop: 10 },
  role: { fontSize: 16, marginTop: 5, opacity: 0.7 },
  menuButton: {
    backgroundColor: '#007aff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 15
  },
  menuText: { color: '#fff', fontSize: 18, fontWeight: '600' }
});
