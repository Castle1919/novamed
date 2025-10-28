import React, { useEffect, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CircularProgress, Box } from '@mui/material'; // Добавлен импорт

import './index.css';
import './i18n'; // Ваша конфигурация i18next
import { useTranslation } from 'react-i18next';

import store from './app/store';
import theme from './theme';
import reportWebVitals from './reportWebVitals';

// Импорты страниц
import App from './pages/main';
import MainPatient from './pages/main-patient';
import MainDoctor from './pages/main-doctor';
import MainDoctorMain from './pages/main-doctor-main';
import MainPatientMain from './pages/main-patient-main';
import ActivationPage from './pages/ActivationPage';
import ErrorPage from './pages/error-page';

// Импорты компонентов
import MainDoctorMainDefault from './components/MainDoctorMainDefault';
import MainDoctorMainPatients from './components/MainDoctorMainPatients';
import MainDoctorMainHistory from './components/MainDoctorMainHistory';
import MainDoctorMainAccounting from './components/MainDoctorMainAccounting';
import MainPatientMainDefault from './components/MainPatientMainDefault';
import MainPatientMainDoctors from './components/MainPatientMainDoctors';
import MainPatientMainAllowance from './components/MainPatientMainAllowance';
import MainPatientMainAppointments from './components/MainPatientMainAppointments';

import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/kk';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---

// 1. Создаем компонент-обертку, который содержит логику смены языка
const AppWrapper = () => {
	const { i18n } = useTranslation();
	
	useEffect(() => {
		// Меняем язык dayjs глобально при смене языка в i18n
		dayjs.locale(i18n.language);
	}, [i18n.language]);

	// Просто возвращаем роутер, который обернут в Suspense
	return (
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>}>
            <RouterProvider router={router} />
        </Suspense>
    );
};

// 2. Создаем роутер
const router = createBrowserRouter([
	{ path: '/', element: <App />, errorElement: <ErrorPage /> },
	{ path: '/activate/:uid/:token', element: <ActivationPage />, errorElement: <ErrorPage /> },
	{ path: '/doctor', element: <MainDoctor />, errorElement: <ErrorPage /> },
	{
		path: '/doctor/main',
		element: <MainDoctorMain />,
		errorElement: <ErrorPage />,
		children: [
			{ index: true, element: <MainDoctorMainDefault /> },
			{ path: 'patients', element: <MainDoctorMainPatients /> },
			{ path: 'history', element: <MainDoctorMainHistory /> },
			{ path: 'accounting', element: <MainDoctorMainAccounting /> },
		],
	},
	{ path: '/patient', element: <MainPatient />, errorElement: <ErrorPage /> },
	{
		path: '/patient/main',
		element: <MainPatientMain />,
		errorElement: <ErrorPage />,
		children: [
			{ index: true, element: <MainPatientMainDefault /> },
			{ path: 'doctors', element: <MainPatientMainDoctors /> },
			{ path: 'appointments', element: <MainPatientMainAppointments /> },
			{ path: 'allowance', element: <MainPatientMainAllowance /> },
		],
	},
]);

// 3. Рендерим приложение, используя AppWrapper
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<Provider store={store}>
			<ThemeProvider theme={theme}>
				<AppWrapper />
			</ThemeProvider>
		</Provider>
	</React.StrictMode>
);


reportWebVitals();