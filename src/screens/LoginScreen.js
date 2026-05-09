import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { loginRequest } from '../services/authService';

// Тестовые пользователи для быстрого входа
const TEST_USERS = {
  doctor: { login: 'doctor1', password: 'hash_doctor', role: 'doctor', name: 'Иванов Иван Иванович' },
  nurse: { login: 'nurse1', password: 'hash_nurse', role: 'nurse', name: 'Петрова Анна Сергеевна' },
  head: { login: 'head1', password: 'hash_head', role: 'head', name: 'Сидоров Николай Николаевич' }
};

export default function LoginScreen({ navigation }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: userLogin, user, isLoading } = useUser();

  // Если уже есть сессия, не показываем экран логина
  useEffect(() => {
    if (!isLoading && user) {
      // Сессия есть, ничего не делаем, навигация сама переключится
      console.log('User already logged in:', user.role);
    }
  }, [user, isLoading]);

  const handleLogin = async () => {
    if (!login.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Введите логин и пароль');
      return;
    }

    setLoading(true);
    try {
      const data = await loginRequest(login.trim(), password.trim());

      userLogin({
        user: {
          id: data.userId,
          login: data.login,
          name: data.fullName,
          role: data.role
        },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessTokenExpiresAt: data.accessTokenExpiresAt
      });

    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    const testUser = TEST_USERS[role];
    if (!testUser) return;

    setLoading(true);
    try {
      // Отправляем реальный запрос на сервер
      const data = await loginRequest(testUser.login, testUser.password);

      userLogin({
        user: {
          id: data.userId,
          login: data.login,
          name: data.fullName,
          role: data.role
        },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessTokenExpiresAt: data.accessTokenExpiresAt
      });

    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Если уже есть пользователь, не показываем форму входа
  if (user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>МедОбход+</Text>
          <Text style={styles.subtitle}>Интеллектуальная система обхода палат</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Логин"
            style={styles.input}
            value={login}
            onChangeText={setLogin}
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            placeholder="Пароль"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Войти в систему</Text>
            )}
          </TouchableOpacity>

          <View style={styles.quickLoginSection}>
            <Text style={styles.quickLoginTitle}>Быстрый вход для тестирования:</Text>
            
            <View style={styles.quickLoginButtons}>
              <TouchableOpacity 
                style={[styles.quickButton, styles.doctorButton]}
                onPress={() => handleQuickLogin('doctor')}
                disabled={loading}
              >
                <Text style={styles.quickButtonText}>Войти как врач</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickButton, styles.nurseButton]}
                onPress={() => handleQuickLogin('nurse')}
                disabled={loading}
              >
                <Text style={styles.quickButtonText}>Войти как медсестра</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickButton, styles.headButton]}
                onPress={() => handleQuickLogin('head')}
                disabled={loading}
              >
                <Text style={styles.quickButtonText}>Войти как заведующий</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.demoCredentials}>
              <Text style={styles.demoTitle}>Демо-доступы:</Text>
              <Text style={styles.demoText}>• Врач: doctor1 / 1234</Text>
              <Text style={styles.demoText}>• Медсестра: nurse1 / 1234</Text>
              <Text style={styles.demoText}>• Заведующий: head1 / 1234</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#007aff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  button: {
    backgroundColor: '#007aff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#99caff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickLoginSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  quickLoginTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickLoginButtons: {
    gap: 10,
    marginBottom: 20,
  },
  quickButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doctorButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  nurseButton: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(40, 167, 69, 0.3)',
  },
  headButton: {
    backgroundColor: 'rgba(111, 66, 193, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(111, 66, 193, 0.3)',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  demoCredentials: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
});