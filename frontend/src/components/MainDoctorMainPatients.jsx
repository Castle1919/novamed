import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import dayjs from 'dayjs';
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
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import userIcon from '../assets/user-icon2.png';
import axios from '../api/axios';
import { getAccessToken } from '../api';
import PatientReceptionModal from './PatientReceptionModal';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import 'dayjs/locale/ru';
import 'dayjs/locale/kk';

// dayjs.locale('ru');

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
	const { t } = useTranslation();
	useEffect(() => {
		const currentLanguage = i18n.language;
		dayjs.locale(currentLanguage);
		// Принудительно обновляем объекты dayjs с новой локалью
		setValue(prev => prev.locale(currentLanguage));
		setSelectedDate(prev => prev.locale(currentLanguage));
	}, [i18n.language]);

	// --- ИСПРАВЛЕНИЕ ЛОГИКИ ЗАГРУЗКИ ---
	useEffect(() => {
		// Загружаем данные только один раз при монтировании
		loadAllAppointments();
		fetchAppointmentsByDate(selectedDate);
	}, []); // Пустой массив зависимостей

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

			const statusOrder = { 'scheduled': 1, 'completed': 2, 'cancelled': 3 };
        appointmentsData.sort((a, b) => {
            const orderA = statusOrder[a.status] || 4;
            const orderB = statusOrder[b.status] || 4;

            // Сначала по статусу
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            
            // Если статусы одинаковые, то по времени
            return new Date(a.date_time) - new Date(b.date_time);
        });

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
						top: '20px',
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
		setValue(newValue.locale(i18n.language)); 
        setSelectedDate(newValue.locale(i18n.language));
        if (newValue) {
			fetchAppointmentsByDate(newValue);
		}
	};

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
			<div className="calendar">
				<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={i18n.language}>
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

				<Button
					size="small"
					onClick={() => setShowLegend(!showLegend)}
					startIcon={showLegend ? <ExpandLessIcon /> : <InfoOutlinedIcon />}
					sx={{ alignItems:'center', width: '100%', textTransform: 'none' }}
				>
					{showLegend ? t("main-doctor-patients.show_legend") : t("main-doctor-patients.hide_legend")}
				</Button>

				<Collapse in={showLegend}>
					<Box sx={{ mt: 1, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
						<Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>
							{t("main-doctor-patients.legend_title")}
						</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<Box sx={{ 
									width: 10, 
									height: 10, 
									bgcolor: '#e8f5e9', 
									border: '2px solid #4caf50', 
									borderRadius: '2px',
									flexShrink: 0 
								}} />
								<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{t("main-doctor-patients.today")}</Typography>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<Box sx={{ 
									width: 10, 
									height: 10, 
									bgcolor: '#ef5350', 
									borderRadius: '2px',
									flexShrink: 0 
								}} />
								<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{t("main-doctor-patients.holiday")}</Typography>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<Typography variant="caption" sx={{ color: '#1976d2', fontSize: '0.9rem', lineHeight: 1 }}>●</Typography>
								<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{t("main-doctor-patients.sheduled_rec")}</Typography>
							</Box>
						</Box>
					</Box>
				</Collapse>
			</div>

			<Divider orientation="vertical" flexItem />

			<div className="reception-container">
				<Box sx={{ mb: 2, p: 2, bgcolor: '#f0f4f8', borderRadius: 2 }}>
					<Typography variant="h6" sx={{ fontWeight: 600 }}>
						{t("main-doctor-patients.reception")}  {selectedDate.format('DD MMMM YYYY')}
					</Typography>
				</Box>

				{error && (
					<Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, mb: 2 }}>
						<Typography color="error">{error}</Typography>
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
							{t("main-doctor-patients.no-entries")}
						</Typography>
					</Box>
				) : (
					<div className="reception-grid">
    {appointments.map((appointment) => (
        <div className="reception-card" key={appointment.id}>
            <div className="reception-card-time">
                <AccessTimeIcon fontSize="small" />
                {dayjs(appointment.date_time).format('HH:mm')}
            </div>

            <img 
                src={appointment.patient_details?.avatar || userIcon} 
                alt="Patient" 
                className="reception-card-avatar"
            />

            <div className="reception-card-info">
                <h3>
                    {appointment.patient_details?.first_name || t("main-doctor-patients.name")} {appointment.patient_details?.last_name || t("main-doctor-patients.last_name")}
                </h3>
                <p>
                    {appointment.notes ? t('main-doctor-patients.complaints', {notes:appointment.notes}) : t("main-doctor-patients.complaints_not_found")}
                </p>
                
                {/* Дополнительные детали */}
                <div className="reception-card-details">
                    <span>📞 {appointment.patient_details?.phone || 'нет номера'}</span>
                    <span>👤 {appointment.patient_details?.age || '?'} {t('main-doctor-patients.years_old')}</span>
                    <span>🚪 Кабинет: {appointment.room_number || t("main-doctor-patients.not_specified")}</span>
                </div>
            </div>

            <Chip 
				label={
					appointment.status === 'scheduled' ? t("main-doctor-patients.wait") :
					appointment.status === 'completed' ? t("main-doctor-patients.done") :
					appointment.status === 'cancelled' ? t("main-doctor-patients.cancel") :
					t("main-doctor-patients.unknown")
				}
				color={
					appointment.status === 'scheduled' ? 'primary' :
					appointment.status === 'completed' ? 'success' :
					appointment.status === 'cancelled' ? 'error' :
					'default'
				}
				size="small"
				sx={{ mx: 2 }}
			/>

            <ColorButton 
				variant="contained" 
				size="small"
				disabled={appointment.status !== 'scheduled'}
				onClick={() => handleStartReception(appointment)}
			>
				{appointment.status === 'scheduled' ? t("main-doctor-patients.accept") : t("main-doctor-patients.done")}
			</ColorButton>
        </div>
    ))}
</div>
				)}
			</div>

			<PatientReceptionModal
				open={receptionOpen}
				onClose={handleReceptionClose}
				onFollowupCreated={() => { loadAllAppointments(); fetchAppointmentsByDate(selectedDate); }}
				appointment={selectedAppointment}
				doctorProfile={profile}
				allAppointments={allAppointments}
			/>
		</div>
	);
}