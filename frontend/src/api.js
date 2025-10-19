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
    // Сохраняем токены под основными ключами и поддерживаем старый формат
    localStorage.setItem("access", access);
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("role", role);
}

// Получить токен
export function getAccessToken() {
    // Поддерживаем оба варианта ключа (новый и старый)
    return localStorage.getItem("access") || localStorage.getItem("access_token");
}

// Получить роль
export function getUserRole() {
    return localStorage.getItem("role");
}

// Выход
export function logout() {
    // Удаляем оба варианта ключей
    localStorage.removeItem("access");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
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
