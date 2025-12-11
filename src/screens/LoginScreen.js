import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { users } from '../data/users';

export default function LoginScreen({ navigation }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    const user = users.find(
      u => u.login === login && u.password === password
    );

    if (!user) {
      Alert.alert("Ошибка", "Неверный логин или пароль");
      return;
    }

    // Переход + передача данных пользователя
    navigation.navigate("Home", {
      role: user.role,
      name: user.name
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>МедОбход+</Text>

      <TextInput
        placeholder="Логин"
        style={styles.input}
        value={login}
        onChangeText={setLogin}
      />

      <TextInput
        placeholder="Пароль"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Войти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 30, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15
  },
  button: {
    backgroundColor: '#007aff',
    padding: 15,
    alignItems: 'center',
    borderRadius: 10
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
