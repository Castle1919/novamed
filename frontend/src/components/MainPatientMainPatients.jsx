import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import Divider from '@mui/material/Divider';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import userIcon from '../assets/user-icon2.png';
import axios from '../api/axios';
import { getAccessToken } from '../api';
import CreatePatientProfile from './CreatePatientProfile';


export default function MainPatientMainPatients() {
	const [value, setValue] = useState(dayjs());
	const [showCreatePatient, setShowCreatePatient] = useState(false);
	const [patient, setPatient] = useState(null);
	const [error, setError] = useState("");

	const ColorButton = styled(Button)(({ theme }) => ({
		color: theme.palette.getContrastText(blue[500]),
		backgroundColor: blue[500],
		'&:hover': {
			backgroundColor: blue[700],
		},
	}));

	const handleChange = (newValue) => {
		setValue(newValue);
		if (newValue) {
			console.log("Выбранная дата:", newValue.format('DD.MM.YYYY'));
		}
	};

	const fetchPatient = async () => {
		const token = getAccessToken();
		if (!token) {
			setError('Токен не найден. Выполните вход.');
			return;
		}

		try {
			const response = await axios.get('/patients/me/', { // отдельный эндпоинт для текущего пациента
				headers: { Authorization: `Bearer ${token}` },
			});
			setPatient(response.data);
		} catch (err) {
			console.error('Error fetching patient:', err);
			// If patient not found, show friendly message and offer to create profile
			if (err.response && err.response.status === 404) {
				setError('Профиль пациента не найден. Создайте профиль, чтобы продолжить.');
				return;
			}
			setError('Ошибка при загрузке данных: ' + (err.message || 'Unknown error'));
		}
	};

	useEffect(() => {
		fetchPatient();
	}, []);

	return (
		<div className="div-for-calendar-and-patients">
			<div className="calendar">
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<DemoContainer components={['DateCalendar']}>
						<DemoItem>
							<DateCalendar value={value} onChange={handleChange} />
						</DemoItem>
					</DemoContainer>
				</LocalizationProvider>
			</div>

			<Divider orientation="vertical" flexItem />

			<div className="patients-history">
				{error && <p style={{ color: 'red' }}>{error}</p>}
				{!patient && !error ? (
					<p>Нет данных для отображения</p>
				) : (
					<div className="patients-history-box">
						<img src={userIcon} alt="Patient" className="patients-history-box-img" />
						<h3>{patient?.first_name} {patient?.last_name}</h3>
						<p className="patients-history-box-p">
							Возраст: {patient?.age ?? "не указан"} | Телефон: {patient?.phone ?? "не указан"}
						</p>
						<ColorButton variant="contained">
							Подробнее
						</ColorButton>
					</div>
				)}
				{error && error.includes('Профиль пациента не найден') && (
					<>
						{/* Автоматически открыть форму создания профиля, без возможности закрыть */}
						<CreatePatientProfile
							open={true}
							disableClose={true}
							onClose={() => {}}
							onCreated={(data) => setPatient(data)}
						/>
					</>
				)}
			</div>
		</div>
	);
}
