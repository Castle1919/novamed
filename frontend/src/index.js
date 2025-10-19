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
import PatientProfilePage from './pages/patient-profile';
import DoctorProfilePage from './pages/doctor-profile';

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
				path: '/doctor/main/patients',
				element: <MainDoctorMainPatients />,
				errorElement: <ErrorPage />,
				children: [
					{
						path: '/doctor/main/patients/:id',
						element: <MainDoctorMain />,
						errorElement: <ErrorPage />,
					},
				],
			},
			{
				path: '/doctor/main/history',
				element: <MainDoctorMainHistory />,
				errorElement: <ErrorPage />,
			},
			{
				path: '/doctor/main/accounting',
				element: <MainDoctorMainAccounting />,
				errorElement: <ErrorPage />,
			},
			{
				path: '/doctor/main/profile',
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
				path: '/patient/main/doctors',
				element: <MainPatientMainDoctors />,
				errorElement: <ErrorPage />,
				children: [
					{
						path: '/patient/main/doctors/:id',
						element: <MainPatientMain />,
						errorElement: <ErrorPage />,
					},
				],
			},
			{
				path: '/patient/main/allowance',
				element: <MainPatientMainAllowance />,
				errorElement: <ErrorPage />,
			},
			{
				path: '/patient/main/profile',
				element: <PatientProfilePage />,
				errorElement: <ErrorPage />,
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
