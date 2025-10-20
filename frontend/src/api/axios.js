import axios from 'axios';

/**
 * Создание экземпляра Axios с базовым URL и настройкой заголовков
 */
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
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
            console.log('Token added to request:', token.substring(0, 20) + '...');
        } else {
            console.warn('No token found in localStorage');
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

/**
 * Интерцептор ответов для обработки ошибок авторизации
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized! Токен недействителен или отсутствует.');
            
            // Очищаем токены
            localStorage.removeItem('access');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('role');
            
            // Перенаправляем на главную страницу, если не на ней
            if (window.location.pathname !== '/') {
                console.log('Redirecting to login page...');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;