import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/';

// console.log("Current API URL:", API_URL); 

const api = axios.create({
    baseURL: '/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// 3. Интерцептор запросов для добавления токена
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access') || localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 4. Интерцептор ответов для обработки ошибок 401 
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized! Токен недействителен или отсутствует. Очистка localStorage...');
            
            localStorage.removeItem('access');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('role');
            
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;