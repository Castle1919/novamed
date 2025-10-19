import axios from 'axios';

/**
 * Создание экземпляра Axios с базовым URL и настройкой заголовков
 */
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/', // базовый URL вашего Django backend
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Интерцептор запросов для добавления токена Authorization
 */
api.interceptors.request.use(
    (config) => {
    // Поддерживаем оба ключа ('access' и устаревший 'access_token')
    const token = localStorage.getItem('access') || localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Интерцептор ответов для обработки ошибок авторизации
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized! Токен недействителен или отсутствует.');
            // Можно здесь добавить логику выхода пользователя
        }
        return Promise.reject(error);
    }
);

export default api;
