import React, { useState, useEffect } from 'react';
import {
	Card, CardContent, Typography, Box, Chip, CircularProgress, Button,
	Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import { useTranslation } from 'react-i18next'; // Импортируем хук
import axios from '../api/axios';
import dayjs from 'dayjs';
import 'dayjs/locale/ru'; // Импорт русской локали для dayjs
import 'dayjs/locale/kk'; // Импорт казахской локали для dayjs
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';

const ColorButton = styled(Button)(({ theme }) => ({
	color: theme.palette.getContrastText(blue[500]),
	backgroundColor: blue[500],
	'&:hover': {
		backgroundColor: blue[700],
	},
}));

export default function MainPatientMainAppointments() {
	const { t, i18n } = useTranslation(); // Инициализируем хук
	const [appointments, setAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [appointmentToDelete, setAppointmentToDelete] = useState(null);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		// Устанавливаем локаль для dayjs в зависимости от языка i18n
		dayjs.locale(i18n.language);
	}, [i18n.language]);

	useEffect(() => {
		loadAppointments();
	}, [t]); // Добавляем t, чтобы ошибки переводились при смене языка

	const loadAppointments = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem('access');
			const response = await axios.get('/appointments/', {
				headers: { Authorization: `Bearer ${token}` }
			});
			let data = Array.isArray(response.data) ? response.data : response.data.results || [];
			data.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
			setAppointments(data);
		} catch (error) {
			console.error('Ошибка при загрузке записей:', error);
			setError(t('appointmentsPage.errors.loadError'));
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteClick = (appointment) => {
		setAppointmentToDelete(appointment);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!appointmentToDelete) return;
		setDeleting(true);
		try {
			const token = localStorage.getItem('access');
			await axios.delete(`/appointments/${appointmentToDelete.id}/`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			setAppointments(appointments.filter(apt => apt.id !== appointmentToDelete.id));
			setDeleteDialogOpen(false);
			setAppointmentToDelete(null);
		} catch (error) {
			console.error('Ошибка при удалении записи:', error);
			alert(t('appointmentsPage.errors.deleteError'));
		} finally {
			setDeleting(false);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setAppointmentToDelete(null);
	};

	if (loading) {
		return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
	}

	if (error) {
		return <Box sx={{ textAlign: 'center', py: 4 }}><Typography color="error">{error}</Typography></Box>;
	}
	
	if (appointments.length === 0) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
				<Box sx={{ textAlign: 'center' }}>
					<EventNoteIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
					<Typography variant="h6" color="text.secondary">{t('appointmentsPage.emptyState.title')}</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>{t('appointmentsPage.emptyState.subtitle')}</Typography>
					<ColorButton variant="contained" href="/patient/main/doctors">{t('appointmentsPage.emptyState.button')}</ColorButton>
				</Box>
			</Box>
		);
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', boxSizing: 'border-box', alignSelf: 'stretch' }}>
			<Typography variant="h5" sx={{ pt: 0, pb: 1, px: 2, fontWeight: 600, textAlign: 'center', flexShrink: 0 }}>
				{t('appointmentsPage.title')}
			</Typography>

			<div style={{ width: '100%', padding: '0 16px 16px 16px', boxSizing: 'border-box', overflowY: 'auto', flex: 1, minHeight: 0 }}>
				{appointments.map((appointment) => (
					<Card key={appointment.id} sx={{ mb: 2, position: 'relative' }}>
						<CardContent>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<PersonIcon color="primary" />
									<Typography variant="h6">{appointment.doctor_details?.name || t('appointmentsPage.card.doctorFallback')}</Typography>
								</Box>
								<Chip
									label={t(`appointmentsPage.status.${appointment.status.toLowerCase()}`, { defaultValue: appointment.status })}
									color={appointment.status === 'scheduled' ? 'primary' : appointment.status === 'completed' ? 'success' : appointment.status === 'cancelled' ? 'error' : 'default'}
									size="small"
								/>
							</Box>
							<Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<LocalHospitalIcon fontSize="small" color="action" />
									<Typography variant="body2">{appointment.doctor_details?.specialization || t('appointmentsPage.card.specialtyFallback')}</Typography>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<CalendarTodayIcon fontSize="small" color="action" />
									<Typography variant="body2">{dayjs(appointment.date_time).format('DD MMMM YYYY')}</Typography>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<AccessTimeIcon fontSize="small" color="action" />
									<Typography variant="body2">{dayjs(appointment.date_time).format('HH:mm')}</Typography>
								</Box>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
								<MeetingRoomIcon fontSize="small" color="action" />
								<Typography variant="body2">{t('appointmentsPage.card.officeLabel')}: {appointment.room_number || appointment.doctor_details?.office_number || t('appointmentsPage.card.officeFallback')}</Typography>
							</Box>
							{appointment.notes && (
								<Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
									<Typography variant="caption" color="text.secondary">{t('appointmentsPage.card.notesLabel')}:</Typography>
									<Typography variant="body2">{appointment.notes}</Typography>
								</Box>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<WarningIcon color="warning" />{t('appointmentsPage.deleteDialog.title')}
				</DialogTitle>
				<DialogContent>
					<Typography variant="body1" gutterBottom>{t('appointmentsPage.deleteDialog.confirmQuestion')}</Typography>
					{appointmentToDelete && (
						<Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
							<Typography variant="body2"><strong>{t('appointmentsPage.deleteDialog.detailsDoctor')}:</strong> {appointmentToDelete.doctor_details?.name}</Typography>
							<Typography variant="body2"><strong>{t('appointmentsPage.deleteDialog.detailsDate')}:</strong> {dayjs(appointmentToDelete.date_time).format('DD MMMM YYYY')}</Typography>
							<Typography variant="body2"><strong>{t('appointmentsPage.deleteDialog.detailsTime')}:</strong> {dayjs(appointmentToDelete.date_time).format('HH:mm')}</Typography>
						</Box>
					)}
					<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>{t('appointmentsPage.deleteDialog.adminNote')}</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel} disabled={deleting}>{t('appointmentsPage.deleteDialog.cancelButton')}</Button>
					<Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={deleting} startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}>
						{deleting ? t('appointmentsPage.deleteDialog.deletingButton') : t('appointmentsPage.deleteDialog.confirmButton')}
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}