import App from './pages/main';
import ActivationPage from './pages/ActivationPage';
import ErrorPage from './pages/error-page';
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CircularProgress, Box } from '@mui/material';
import './index.css';
import './i18n';
import store from './app/store';
import theme from './theme';
import reportWebVitals from './reportWebVitals';

const PageLoader = () => (
	<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
		<CircularProgress />
	</Box>
);


const MainDoctor = lazy(() => import('./pages/main-doctor'));
const MainPatient = lazy(() => import('./pages/main-patient'));
const MainDoctorMain = lazy(() => import('./pages/main-doctor-main'));
const MainPatientMain = lazy(() => import('./pages/main-patient-main'));

const MainDoctorMainDefault = lazy(() => import('./components/MainDoctorMainDefault'));
const MainDoctorMainPatients = lazy(() => import('./components/MainDoctorMainPatients'));
const MainDoctorMainHistory = lazy(() => import('./components/MainDoctorMainHistory'));
const MainDoctorMainAccounting = lazy(() => import('./components/MainDoctorMainAccounting'));

const MainPatientMainDefault = lazy(() => import('./components/MainPatientMainDefault'));
const MainPatientMainDoctors = lazy(() => import('./components/MainPatientMainDoctors'));
const MainPatientMainAllowance = lazy(() => import('./components/MainPatientMainAllowance'));
const MainPatientMainAppointments = lazy(() => import('./components/MainPatientMainAppointments'));

const router = createBrowserRouter([
	{ path: '/', element: <App />, errorElement: <ErrorPage /> },
	{ path: '/activate/:uid/:token', element: <ActivationPage />, errorElement: <ErrorPage /> },
	{
		path: '/doctor',
		element: <Suspense fallback={<PageLoader />}><MainDoctor /></Suspense>,
		errorElement: <ErrorPage />
	},
	{
		path: '/doctor/main',
		element: <Suspense fallback={<PageLoader />}><MainDoctorMain /></Suspense>,
		errorElement: <ErrorPage />,
		children: [
			{ index: true, element: <Suspense fallback={<PageLoader />}><MainDoctorMainDefault /></Suspense> },
			{ path: 'patients', element: <Suspense fallback={<PageLoader />}><MainDoctorMainPatients /></Suspense> },
			{ path: 'history', element: <Suspense fallback={<PageLoader />}><MainDoctorMainHistory /></Suspense> },
			{ path: 'accounting', element: <Suspense fallback={<PageLoader />}><MainDoctorMainAccounting /></Suspense> },
		],
	},
	{
		path: '/patient',
		element: <Suspense fallback={<PageLoader />}><MainPatient /></Suspense>,
		errorElement: <ErrorPage />
	},
	{
		path: '/patient/main',
		element: <Suspense fallback={<PageLoader />}><MainPatientMain /></Suspense>,
		errorElement: <ErrorPage />,
		children: [
			{ index: true, element: <Suspense fallback={<PageLoader />}><MainPatientMainDefault /></Suspense> },
			{ path: 'doctors', element: <Suspense fallback={<PageLoader />}><MainPatientMainDoctors /></Suspense> },
			{ path: 'appointments', element: <Suspense fallback={<PageLoader />}><MainPatientMainAppointments /></Suspense> },
			{ path: 'allowance', element: <Suspense fallback={<PageLoader />}><MainPatientMainAllowance /></Suspense> },
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