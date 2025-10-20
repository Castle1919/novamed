import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Авторизация: логин
export async function login(username, password) {
    try {
        const response = await api.post("/accounts/login/", { username, password });
        return response.data;
    } catch (err) {
        console.error("Ошибка входа:", err);
        throw err;
    }
}

// Сохраняем токены и роль в localStorage
export function setTokens({ access, refresh, role }) {
    console.log('Saving tokens to localStorage:', { access: access?.substring(0, 20) + '...', role });
    
    // Сохраняем токены под основными ключами
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("role", role);
    
    // Для обратной совместимости сохраняем и под старыми ключами
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    
    console.log('Tokens saved. Verifying:', localStorage.getItem('access')?.substring(0, 20) + '...');
}

// Получить токен
export function getAccessToken() {
    const token = localStorage.getItem("access") || localStorage.getItem("access_token");
    if (token) {
        console.log('Token retrieved:', token.substring(0, 20) + '...');
    } else {
        console.warn('No token found in localStorage');
    }
    return token;
}

// Получить роль
export function getUserRole() {
    const role = localStorage.getItem("role");
    console.log('User role:', role);
    return role;
}

// Выход
export function logout() {
    console.log('Logging out, clearing tokens...');
    
    // Удаляем все варианты ключей
    localStorage.removeItem("access");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    
    console.log('Tokens cleared');
}

// Получить список пациентов (для доктора)
export async function fetchPatients() {
    const token = getAccessToken();
    if (!token) throw new Error("Токен не найден");

    const response = await api.get("/patients/", {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

// Получить текущего пациента (для пациента)
export async function fetchMyPatient() {
    const token = getAccessToken();
    if (!token) throw new Error("Токен не найден");

    const response = await api.get("/patients/me/", {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

export default api;