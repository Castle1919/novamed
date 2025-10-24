import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(HttpApi) // Загружает переводы по HTTP
    .use(LanguageDetector) // Определяет язык пользователя
    .use(initReactI18next) // Инициализирует react-i18next
    .init({
        // Язык по умолчанию
        fallbackLng: 'ru',
        debug: true, // Включите для отладки в консоли

        // Опции для детектора языка
        detection: {
            order: ['queryString', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
            caches: ['cookie'], // Где сохранять выбор пользователя
        },

        // Настройки для бэкенда (загрузчика)
        backend: {
            loadPath: '/locales/{{lng}}/translation.json', // Путь к вашим файлам
        },

        interpolation: {
            escapeValue: false, // React уже защищает от XSS
        }
    });

export default i18n;