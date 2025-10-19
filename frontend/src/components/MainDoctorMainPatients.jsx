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

export default function MainDoctorMainPatients() {
	const [value, setValue] = useState(dayjs());
	const [patients, setPatients] = useState([]);
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

	const fetchPatients = async () => {
		const token = getAccessToken();
		if (!token) {
			setError('Токен не найден. Выполните вход.');
			return;
		}

		try {
			const response = await axios.get('/patients/', {
				headers: { Authorization: `Bearer ${token}` },
			});
			setPatients(Array.isArray(response.data) ? response.data : []);
		} catch (err) {
			console.error('Error fetching patients:', err);
			setError('Ошибка при загрузке пациентов: ' + err.message);
		}
	};

	useEffect(() => {
		fetchPatients();
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
				{patients.length === 0 && !error ? (
					<p>Нет пациентов для отображения</p>
				) : (
					patients.map((patient) => (
						<div className="patients-history-box" key={patient.id}>
							<img src={userIcon} alt="Patient" className="patients-history-box-img" />
							<h3>{patient.first_name} {patient.last_name}</h3>
							<p className="patients-history-box-p">
								Возраст: {patient.age ?? "не указан"} | Телефон: {patient.phone ?? "не указан"}
							</p>
							<ColorButton variant="contained">
								Подробнее
							</ColorButton>
						</div>
					))
				)}
			</div>
		</div>
	);
}
