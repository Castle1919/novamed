import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './pages/main';
import MainPatient from './pages/main-patient';
import MainDoctor from './pages/main-doctor';
import MainDoctorMain from './pages/main-doctor-main';
import MainPatientMain from './pages/main-patient-main';
import reportWebVitals from './reportWebVitals';
import {
	createBrowserRouter,
	RouterProvider,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import ErrorPage from './pages/error-page';
import store from './app/store';
import MainDoctorMainPatients from './components/MainDoctorMainPatients';
import MainDoctorMainHistory from './components/MainDoctorMainHistory';
import MainDoctorMainAccounting from './components/MainDoctorMainAccounting';
import MainDoctorMainDefault from './components/MainDoctorMainDefault';
import MainPatientMainDefault from './components/MainPatientMainDefault';
import MainPatientMainPatients from './components/MainPatientMainPatients';
import MainPatientMainDoctors from './components/MainPatientMainDoctors';
import MainPatientMainAllowance from './components/MainPatientMainAllowance';
import MainPatientMainAppointments from './components/MainPatientMainAppointments';
import PatientProfilePage from './pages/patient-profile';
import DoctorProfilePage from './pages/doctor-profile';
import ActivationPage from './pages/ActivationPage';


const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
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
				path: 'patients', // Относительный путь (лучше так)
				element: <MainDoctorMainPatients />,
				errorElement: <ErrorPage />,
			},
			{
				path: 'patients/:id', // Относительный путь
				element: <MainDoctorMain />,
				errorElement: <ErrorPage />,
			},
			{
				path: 'history', // Относительный путь
				element: <MainDoctorMainHistory />,
				errorElement: <ErrorPage />,
			},
			{
				path: 'accounting', // Относительный путь
				element: <MainDoctorMainAccounting />,
				errorElement: <ErrorPage />,
			},
			{
				path: 'profile', // Относительный путь
				element: <DoctorProfilePage />,
				errorElement: <ErrorPage />,
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
				path: 'doctors', // Относительный путь
				element: <MainPatientMainDoctors />,
				errorElement: <ErrorPage />,
			},
			{
				path: 'doctors/:id', // Относительный путь
				element: <MainPatientMain />,
				errorElement: <ErrorPage />,
			},
			{
				path: 'appointments', // ДОБАВЛЕНО - маршрут для "Мои записи"
				element: <MainPatientMainAppointments />,
				errorElement: <ErrorPage />,
			},
			{
				path: 'allowance', // Относительный путь
				element: <MainPatientMainAllowance />,
				errorElement: <ErrorPage />,
			},
			{
				path: 'profile', // Относительный путь
				element: <PatientProfilePage />,
				errorElement: <ErrorPage />,
			},
		],
		
	},
	{
		path: '/activate/:uid/:token',
		element: <ActivationPage />,
	},
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<Provider store={store}>
		<RouterProvider router={router} />
	</Provider>
);

reportWebVitals();