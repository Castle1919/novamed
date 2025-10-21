import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import Divider from '@mui/material/Divider';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import userIcon from '../assets/user-icon2.png';
import axios from '../api/axios';
import { getAccessToken } from '../api';
import PatientReceptionModal from './PatientReceptionModal';


dayjs.locale('ru');

const ColorButton = styled(Button)(({ theme }) => ({
	color: theme.palette.getContrastText(blue[500]),
	backgroundColor: blue[500],
	'&:hover': {
		backgroundColor: blue[700],
	},
}));

export default function MainDoctorMainPatients() {
	const [value, setValue] = useState(dayjs());
	const [selectedDate, setSelectedDate] = useState(dayjs());
	const [appointments, setAppointments] = useState([]);
	const [allAppointments, setAllAppointments] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [showLegend, setShowLegend] = useState(false);
	const [receptionOpen, setReceptionOpen] = useState(false);
	const [selectedAppointment, setSelectedAppointment] = useState(null);
	const { profile } = useOutletContext();
	const holidays = [
		'2025-01-01', '2025-01-02', '2025-01-07',
		'2025-03-08', '2025-03-21', '2025-03-22', '2025-03-23',
		'2025-05-01', '2025-05-07', '2025-05-09',
		'2025-07-06', '2025-08-30', '2025-10-25',
		'2025-12-16', '2025-12-17',
	];

	// Функция для загрузки ВСЕХ записей врача
	const loadAllAppointments = async () => {
		const token = getAccessToken();
		if (!token) return;

		try {
			const response = await axios.get('/appointments/', {
				headers: { Authorization: `Bearer ${token}` },
			});

			const data = Array.isArray(response.data)
				? response.data
				: response.data.results || [];

			setAllAppointments(data);
		} catch (err) {
			console.error('Error loading all appointments:', err);
		}
	};

	// Функция для загрузки записей по дате
	const fetchAppointmentsByDate = async (date) => {
		const token = getAccessToken();
		if (!token) {
			setError('Токен не найден. Выполните вход.');
			return;
		}

		setLoading(true);
		setError('');

		try {
			const formattedDate = date.format('YYYY-MM-DD');

			const response = await axios.get('/appointments/', {
				params: { date: formattedDate },
				headers: { Authorization: `Bearer ${token}` },
			});

			let appointmentsData = Array.isArray(response.data)
				? response.data
				: response.data.results || [];

			appointmentsData = appointmentsData.filter(apt =>
				dayjs(apt.date_time).format('YYYY-MM-DD') === formattedDate
			);

			// Сортировка по времени
			appointmentsData.sort((a, b) =>
				new Date(a.date_time) - new Date(b.date_time)
			);

			setAppointments(appointmentsData);
		} catch (err) {
			console.error('Error fetching appointments:', err);
			if (err.response?.status === 403) {
				setError('Доступ запрещен. Проверьте права доступа.');
			} else {
				setError('Ошибка при загрузке записей');
			}
			setAppointments([]);
		} finally {
			setLoading(false);
		}
	};

	// Кастомный рендер дней календаря
	const ServerDay = (props) => {
		const { day, outsideCurrentMonth, ...other } = props;

		if (!day || typeof day.format !== 'function') {
			return <PickersDay {...props} />;
		}

		const dateStr = day.format('YYYY-MM-DD');
		const isToday = day.isSame(dayjs(), 'day');
		const isHoliday = holidays.includes(dateStr);
		const isWeekend = day.day() === 0 || day.day() === 6;

		const hasScheduled = allAppointments.some(
			(apt) =>
				dayjs(apt.date_time).format('YYYY-MM-DD') === dateStr &&
				apt.status === 'scheduled'
		);

		return (
			<Badge
				key={day.toString()}
				overlap="circular"
				badgeContent={hasScheduled ? '●' : undefined}
				sx={{
					'& .MuiBadge-badge': {
						fontSize: '10px',
						color: '#1976d2',
						backgroundColor: 'transparent',
						right: '50%',
						transform: 'translateX(50%)',
						top: '32px',
						pointerEvents: 'none',
					},
				}}
			>
				<PickersDay
					{...other}
					day={day}
					outsideCurrentMonth={outsideCurrentMonth}
					sx={{
						backgroundColor: isToday ? '#e8f5e9' : (isHoliday || isWeekend) ? '#ffebee' : undefined,
						color: (isHoliday || isWeekend) ? '#d32f2f' : undefined,
						border: isToday ? '2px solid #4caf50' : undefined,
						fontWeight: isToday ? 'bold' : undefined,
						'&:hover': {
							backgroundColor: isToday ? '#c8e6c9' : (isHoliday || isWeekend) ? '#ffcdd2' : undefined,
						},
					}}
				/>
			</Badge>
		);
	};

	// Обработчик изменения даты
	const handleChange = (newValue) => {
		setValue(newValue);
		setSelectedDate(newValue);
		if (newValue) {
			fetchAppointmentsByDate(newValue);
		}
	};

	// Загружаем записи при монтировании
	useEffect(() => {
		fetchAppointmentsByDate(selectedDate);
		loadAllAppointments();
	}, []);



	const handleStartReception = (appointment) => {
		setSelectedAppointment(appointment);
		setReceptionOpen(true);
	};
	const handleReceptionClose = (success) => {
		setReceptionOpen(false);
		setSelectedAppointment(null);
		if (success) {
			fetchAppointmentsByDate(selectedDate);
		}
	};

	return (
		<div className="div-for-calendar-and-patients">
			{/* Календарь */}
			<div className="calendar" style={{ position: 'relative' }}>
				<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
					<DemoContainer components={['DateCalendar']}>
						<DemoItem>
							<DateCalendar
								value={value}
								onChange={handleChange}
								slots={{
									day: ServerDay,
								}}
							/>
						</DemoItem>
					</DemoContainer>
				</LocalizationProvider>

				{/* Кнопка для показа легенды */}
				<Button
					size="small"
					onClick={() => setShowLegend(!showLegend)}
					startIcon={showLegend ? <ExpandLessIcon /> : <InfoOutlinedIcon />}
					sx={{
						mt: 1,
						width: '100%',
						textTransform: 'none',
					}}
				>
					{showLegend ? 'Скрыть обозначения' : 'Показать обозначения'}
				</Button>

				{/* Выдвижная легенда с абсолютным позиционированием */}
				{showLegend && (
					<Box sx={{
						position: 'absolute',
						bottom: 60,
						left: 0,
						right: 0,
						p: 1.5,
						bgcolor: 'white',
						borderRadius: 1,
						boxShadow: 3,
						border: '1px solid #e0e0e0',
						zIndex: 1000,
					}}>
						<Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>
							Обозначения:
						</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<Box sx={{
									width: 12,
									height: 12,
									bgcolor: '#e8f5e9',
									border: '2px solid #4caf50',
									borderRadius: '2px',
									flexShrink: 0
								}} />
								<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Сегодня</Typography>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<Box sx={{
									width: 12,
									height: 12,
									bgcolor: '#ef5350', // Более контрастный цвет
									borderRadius: '2px',
									flexShrink: 0
								}} />
								<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Выходные/Праздники</Typography>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<Typography variant="caption" sx={{ color: '#1976d2', fontSize: '0.9rem', lineHeight: 1 }}>●</Typography>
								<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Есть записи</Typography>
							</Box>
						</Box>
					</Box>
				)}
			</div>

			<Divider orientation="vertical" flexItem />

			<div className="patients-history">
				{error && (
					<Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, mb: 2, border: '1px solid #ef5350' }}>
						<Typography color="error" variant="body2">⚠️ {error}</Typography>
					</Box>
				)}

				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress />
					</Box>
				) : appointments.length === 0 ? (
					<Box sx={{ textAlign: 'center', py: 4 }}>
						<CalendarTodayIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
						<Typography variant="body1" color="text.secondary">
							На выбранную дату записей нет
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Выберите другую дату в календаре
						</Typography>
					</Box>
				) : (
					appointments.map((appointment) => (
						<Box
							key={appointment.id}
							sx={{
								p: 1.5,
								mb: 1,
								borderRadius: 2,
								boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
								bgcolor: '#fff',
								border: '1px solid #e0e0e0',
								display: 'flex',
								alignItems: 'center',
								gap: 2,
								transition: 'all 0.2s',
								'&:hover': {
									boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
									borderColor: blue[500],
								}
							}}
						>
							{/* Время */}
							<Box sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 0.5,
								minWidth: '70px',
								bgcolor: '#f5f5f5',
								p: 1,
								borderRadius: 1,
							}}>
								<AccessTimeIcon fontSize="small" color="primary" />
								<Typography variant="body2" fontWeight="600">
									{dayjs(appointment.date_time).format('HH:mm')}
								</Typography>
							</Box>

							{/* Аватар */}
							<img
								src={appointment.patient_details?.avatar || userIcon}
								alt="Patient"
								style={{
									width: 40,
									height: 40,
									borderRadius: '50%',
									objectFit: 'cover',
									border: '2px solid #e0e0e0'
								}}
							/>

							{/* Информация о пациенте */}
							<Box sx={{ flex: 1 }}>
								<Typography variant="body1" fontWeight="600">
									{appointment.patient_details?.first_name} {appointment.patient_details?.last_name}
								</Typography>
								<Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
									{appointment.patient_details?.phone && (
										<Typography variant="caption" color="text.secondary">
											📞 {appointment.patient_details.phone}
										</Typography>
									)}
									{appointment.patient_details?.age && (
										<Typography variant="caption" color="text.secondary">
											{appointment.patient_details.age} лет
										</Typography>
									)}
								</Box>
								{appointment.notes && (
									<Typography variant="caption" color="text.secondary" sx={{
										display: 'block',
										mt: 0.5,
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}>
										📋 {appointment.notes}
									</Typography>
								)}
							</Box>

							{/* Статус */}
							<Chip
								label={
									appointment.status === 'scheduled' ? 'Запланировано' :
										appointment.status === 'completed' ? 'Завершено' :
											appointment.status === 'cancelled' ? 'Отменено' :
												appointment.status
								}
								color={
									appointment.status === 'scheduled' ? 'primary' :
										appointment.status === 'completed' ? 'success' :
											appointment.status === 'cancelled' ? 'error' :
												'default'
								}
								size="small"
							/>

							{/* Кнопка действия */}
							<ColorButton
								variant="contained"
								size="small"
								disabled={appointment.status !== 'scheduled'}
								onClick={() => handleStartReception(appointment)}
							>
								{appointment.status === 'scheduled' ? 'Принять' : 'Завершён'}
							</ColorButton>
							<PatientReceptionModal
								open={receptionOpen}
								onClose={handleReceptionClose}
								appointment={selectedAppointment}
								onFollowupCreated={() => { loadAllAppointments(); fetchAppointmentsByDate(selectedDate); }}
								doctorProfile={profile}
								allAppointments={allAppointments}

							/>
						</Box>
					))
				)}
			</div>
		</div>
	);
}