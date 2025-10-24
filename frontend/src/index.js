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
import MainPatientMainDoctors from './components/MainPatientMainDoctors';
import MainPatientMainAllowance from './components/MainPatientMainAllowance';
import MainPatientMainAppointments from './components/MainPatientMainAppointments';
import ActivationPage from './pages/ActivationPage';


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
	<Provider store={store}>
		<RouterProvider router={router} />
	</Provider>
);

reportWebVitals();