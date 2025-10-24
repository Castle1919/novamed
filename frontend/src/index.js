import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';

import './index.css';
import './i18n';

import store from './app/store';
import theme from './theme';
import reportWebVitals from './reportWebVitals';

import App from './pages/main';
import MainPatient from './pages/main-patient';
import MainDoctor from './pages/main-doctor';
import MainDoctorMain from './pages/main-doctor-main';
import MainPatientMain from './pages/main-patient-main';
import ActivationPage from './pages/ActivationPage';
import ErrorPage from './pages/error-page';

import MainDoctorMainDefault from './components/MainDoctorMainDefault';
import MainDoctorMainPatients from './components/MainDoctorMainPatients';
import MainDoctorMainHistory from './components/MainDoctorMainHistory';
import MainDoctorMainAccounting from './components/MainDoctorMainAccounting';

import MainPatientMainDefault from './components/MainPatientMainDefault';
import MainPatientMainDoctors from './components/MainPatientMainDoctors';
import MainPatientMainAllowance from './components/MainPatientMainAllowance';
import MainPatientMainAppointments from './components/MainPatientMainAppointments';

const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
		errorElement: <ErrorPage />,
	},
	{
		path: '/activate/:uid/:token',
		element: <ActivationPage />,
		errorElement: <ErrorPage />,
	},
	{
		path: '/doctor',
		element: <MainDoctor />,
		errorElement: <ErrorPage />,
	},
	{
		path: '/doctor/main',
		element: <MainDoctorMain />,
		errorElement: <ErrorPage />,
		children: [
			{
				index: true,
				element: <MainDoctorMainDefault />,
			},
			{
				path: 'patients',
				element: <MainDoctorMainPatients />,
			},
			{
				path: 'history',
				element: <MainDoctorMainHistory />,
			},
			{
				path: 'accounting',
				element: <MainDoctorMainAccounting />,
			},
			{
				path: 'history', // Список пациентов
				element: <MainDoctorMainHistory />,
			},
		],
	},
	{
		path: '/patient',
		element: <MainPatient />,
		errorElement: <ErrorPage />,
	},
	{
		path: '/patient/main',
		element: <MainPatientMain />,
		errorElement: <ErrorPage />,
		children: [
			{
				index: true,
				element: <MainPatientMainDefault />,
			},
			{
				path: 'doctors',
				element: <MainPatientMainDoctors />,
			},
			{
				path: 'appointments',
				element: <MainPatientMainAppointments />,
			},
			{
				path: 'allowance',
				element: <MainPatientMainAllowance />,
			},
		],
	},
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<Provider store={store}>
			<ThemeProvider theme={theme}>
				<RouterProvider router={router} />
			</ThemeProvider>
		</Provider>
	</React.StrictMode>
);

reportWebVitals();