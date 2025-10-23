import React, { useEffect, useMemo, useState } from 'react';
import {
	Modal, Box, Typography, TextField, Button, Grid, IconButton,
	Divider, Chip, CircularProgress, Accordion, AccordionSummary,
	AccordionDetails, Alert, Tooltip, MenuItem, Select, InputLabel,
	FormControl, Snackbar, Checkbox, FormControlLabel, Badge
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, PickersDay } from '@mui/x-date-pickers';
import axios from '../api/axios';
import generatePdf from './pdfGenerator';

dayjs.locale('ru');

const style = {
	position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
	width: '95%', maxWidth: 1200, maxHeight: '90vh',
	bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2,
	p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden'
};

export default function PatientReceptionModal({ open, onClose, appointment, onFollowupCreated, doctorProfile, allAppointments }) {
	const [saving, setSaving] = useState(false);
	const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
	const [medicines, setMedicines] = useState([]);
	const [templates, setTemplates] = useState([]);
	const [history, setHistory] = useState([]);
	const [form, setForm] = useState({
		complaints: '',
		anamnesis: '',
		objective_data: '',
		diagnosis: '',
		recommendations: '',
		doctor_notes: '',
	});
	const [prescriptions, setPrescriptions] = useState([]);
	const [needFollowUp, setNeedFollowUp] = useState(false);
	const [followUpDate, setFollowUpDate] = useState(null);
	const [followUpTime, setFollowUpTime] = useState(null);
	const [availableSlots, setAvailableSlots] = useState([]);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [recordId, setRecordId] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [pendingFiles, setPendingFiles] = useState([]);
	const [currentFiles, setCurrentFiles] = useState([]);

	const holidays = [
		'2024-01-01', '2024-01-02', '2024-01-07', '2024-03-08', '2024-03-21', '2024-03-22', '2024-03-23', '2024-05-01', '2024-05-07', '2024-05-09', '2024-07-06', '2024-08-30', '2024-10-25', '2024-12-16', '2024-12-17', '2025-01-01', '2025-01-02', '2025-01-07', '2025-03-08', '2025-03-21', '2025-03-22', '2025-03-23', '2025-05-01', '2025-05-07', '2025-05-09', '2025-07-06', '2025-08-30', '2025-10-25', '2025-12-16', '2025-12-17',
	];

	const patientId = appointment?.patient_details?.id;

	useEffect(() => {
		if (!open || !appointment) return;
		setForm({
			complaints: appointment.notes || '',
			anamnesis: '',
			objective_data: '',
			diagnosis: '',
			recommendations: '',
			doctor_notes: '',
		});
		loadMedicines(); loadTemplates(); loadHistory();
		setPrescriptions([]); setRecordId(null);
		setPendingFiles([]); setCurrentFiles([]);
		setNeedFollowUp(false); setFollowUpDate(null); setFollowUpTime(null);
	}, [open, appointment]);

	useEffect(() => {
		if (followUpDate && doctorProfile?.id) {
			loadAvailableSlots();
		}
	}, [followUpDate, doctorProfile]);

	const loadMedicines = async () => {
		if (!patientId) return;
		try {
			const res = await axios.get('/medicines/list/', { params: { patient_id: patientId } });
			setMedicines(Array.isArray(res.data) ? res.data : []);
		} catch (e) {
			console.error('loadMedicines error', e);
		}
	};

	const loadTemplates = async () => {
		try {
			const res = await axios.get('/diagnosis-templates/');
			setTemplates(Array.isArray(res.data) ? res.data : []);
		} catch (e) {
			console.error('loadTemplates error', e);
		}
	};

	const loadHistory = async () => {
		if (!patientId) return;
		try {
			const res = await axios.get(`/patients/${patientId}/history/`);
			setHistory(res.data?.history || []);
		} catch (e) {
			console.error('loadHistory error', e);
		}
	};

	const loadAvailableSlots = async () => {
		if (!followUpDate || !doctorProfile?.id) return;

		setLoadingSlots(true);
		setAvailableSlots([]);
		try {
			const formattedDate = followUpDate.format('YYYY-MM-DD');
			const response = await axios.get('/appointments/available-slots/', {
				params: { doctor_id: doctorProfile.id, date: formattedDate },
			});

			if (response.data.success) {
				let slots = response.data.slots;
				if (Array.isArray(slots)) {
					slots = slots.filter(slot => slot.available === true);
				}
				setAvailableSlots(slots || []);
			} else {
				setAvailableSlots([]);
			}
		} catch (err) {
			console.error('Error loading slots:', err);
			setAvailableSlots([]);
		} finally {
			setLoadingSlots(false);
		}
	};

	const getSlotTime = (slot) => {
		if (typeof slot === 'string') return slot;
		return slot.time || slot.datetime?.split('T')[1]?.substring(0, 5) || '00:00';
	};

	const addPrescription = () => {
		setPrescriptions(prev => [...prev, { medicine_id: null, medicine: null, dosage: '', frequency: '', duration: '', instructions: '', warning: null }]);
	};

	const removePrescription = (idx) => {
		setPrescriptions(prev => prev.filter((_, i) => i !== idx));
	};

	const updatePrescription = (idx, patch) => {
		setPrescriptions(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));
	};

	const onSelectMedicine = (idx, medId) => {
		const med = medicines.find(m => String(m.id) === String(medId)) || null;
		const warning = med?.has_allergy ? '⚠ У пациента возможна аллергия на этот препарат' : null;
		updatePrescription(idx, { medicine_id: medId, medicine: med, warning });
	};

	const applyTemplate = async (templateId) => {
		const tpl = templates.find(t => String(t.id) === String(templateId));
		if (!tpl) return;
		setForm(f => ({
			...f,
			diagnosis: tpl.diagnosis || f.diagnosis,
			recommendations: tpl.recommendations || f.recommendations
		}));
		try { await axios.post(`/diagnosis-templates/${templateId}/use/`); } catch { }
		setSnack({ open: true, message: 'Шаблон применён', severity: 'success' });
	};

	const printPrescriptionPDF = () => {
		if (prescriptions.length === 0) {
			setSnack({ open: true, message: 'Добавьте хотя бы одно назначение', severity: 'warning' });
			return;
		}
		const data = {
			appointment,
			form,
			prescriptions,
			doctorName: `${doctorProfile?.first_name || ''} ${doctorProfile?.last_name || ''}`.trim() || 'Врач не указан'
		};
		generatePdf(data);
	};

	const uploadFile = async (file, fileType, title, description, medicalRecordId) => {
		const fd = new FormData();
		fd.append('file', file);
		fd.append('file_type', fileType);
		fd.append('title', title || file.name);
		if (description) fd.append('description', description);
		fd.append('medical_record_id', medicalRecordId);

		try {
			const { data } = await axios.post(`/patients/${patientId}/files/upload/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
			if (data?.file) setCurrentFiles(prev => [...prev, data.file]);
			return true;
		} catch (e) {
			const msg = e?.response?.data?.error || 'Ошибка загрузки файла';
			setSnack({ open: true, message: msg, severity: 'error' });
			return false;
		}
	};

	const uploadPendingFilesSequential = async (currentRecordId) => {
		if (!currentRecordId || pendingFiles.length === 0) return;
		setUploading(true);
		try {
			let ok = 0, fail = 0;
			for (const f of pendingFiles) {
				const okOne = await uploadFile(f.file, f.file_type, f.title, f.description || '', currentRecordId);
				okOne ? ok++ : fail++;
			}
			setPendingFiles([]);
			if (ok > 0) {
				setSnack({ open: true, message: `Файлы (${ok} шт.) успешно загружены`, severity: 'success' });
			}
		} finally {
			setUploading(false);
		}
	};

	const createFollowUpAppointment = async () => {
		if (!needFollowUp || !followUpDate || !followUpTime) return false;

		try {
			const dateTimeStr = `${followUpDate.format('YYYY-MM-DD')}T${followUpTime}:00`;
			const patientName = `${appointment.patient_details?.last_name || ''} ${appointment.patient_details?.first_name?.[0] || ''}.`;

			await axios.post('/appointments/create-by-doctor/', {
				patient_id: patientId,
				date_time: dateTimeStr,
				notes: `Повторный визит - ${patientName}`
			});

			if (typeof onFollowupCreated === 'function') onFollowupCreated();
			return true; // Возвращаем true при успехе
		} catch (e) {
			const msg = e.response?.data?.message || e.response?.data?.error || 'Ошибка при создании повторного визита';
			setSnack({ open: true, message: msg, severity: 'error' });
			return false; // Возвращаем false при ошибке
		}
	};

	const syncActiveMedicines = async (isActive) => {
		const doctorId = doctorProfile?.id;

		console.log('[ОТЛАДКА SYNC] Начало синхронизации');
		console.log('[ОТЛАДКА SYNC] doctorProfile:', doctorProfile);
		console.log('[ОТЛАДКА SYNC] doctorId:', doctorId);
		console.log('[ОТЛАДКА SYNC] patientId:', patientId);

		if (!doctorId || !patientId) {
			console.error("syncActiveMedicines: doctorId или patientId не найдены. Синхронизация отменена.");
			return;
		}

		try {
			const payload = {
				patient_id: patientId,
				active: isActive, // Используем переданное значение
				medicines: []
			};

			if (isActive) {
				payload.medicines = prescriptions
					.filter(p => !!p.medicine_id)
					.map(p => ({
						medicine_id: p.medicine_id,
						dosage: p.dosage || '',
						frequency: p.frequency || '',
						duration: p.duration || '',
						instructions: p.instructions || '',
					}));
			}
			await axios.post('/patients/active-medicines/sync/', payload);
		} catch (e) {
			console.error('Ошибка при синхронизации активных препаратов:', e);
		}
	};

	const completeReception = async () => {
		if (!form.diagnosis.trim()) {
			setSnack({ open: true, message: 'Диагноз обязателен', severity: 'warning' });
			return;
		}

		if (needFollowUp && (!followUpDate || !followUpTime)) {
			setSnack({ open: true, message: 'Укажите дату и время повторного визита', severity: 'warning' });
			return;
		}

		setSaving(true);

		try {
			// Сначала пытаемся создать повторный визит, если нужно
			let followupOK = false;
			if (needFollowUp) {
				followupOK = await createFollowUpAppointment();
				if (!followupOK) {
					// Если создание повторного визита не удалось, прерываем операцию
					setSaving(false);
					return;
				}
			}

			// Завершаем основной прием
			const payload = {
				complaints: form.complaints,
				anamnesis: form.anamnesis,
				objective_data: form.objective_data,
				diagnosis: form.diagnosis,
				recommendations: form.recommendations,
				doctor_notes: form.doctor_notes,
				prescriptions: prescriptions
					.filter(p => !!p.medicine_id)
					.map(p => ({
						medicine_id: p.medicine_id,
						dosage: p.dosage,
						frequency: p.frequency,
						duration: p.duration,
						instructions: p.instructions
					}))
			};
			const res = await axios.post(`/appointments/${appointment.id}/complete/`, payload);
			const mrId = res.data?.medical_record_id;

			// Загружаем файлы, если они есть
			if (mrId && pendingFiles.length > 0) {
				await uploadPendingFilesSequential(mrId);
			}

			// Синхронизируем активные препараты
			// `followupOK` будет true, только если галочка стояла и визит создался
			await syncActiveMedicines(followupOK);

			setSnack({ open: true, message: 'Прием успешно завершён!', severity: 'success' });

			// Закрываем модалку через секунду
			setTimeout(() => {
				onClose(true); // Вызываем onClose для закрытия и обновления
			}, 1200);

		} catch (e) {
			const msg = e?.response?.data?.error || e?.response?.data?.message || 'Ошибка при завершении приема';
			setSnack({ open: true, message: msg, severity: 'error' });
			setSaving(false); // Сбрасываем saving при ошибке
		}
		// `finally` убран, чтобы `setSaving(false)` не срабатывал до `onClose`
	};

	const AllergyAlert = useMemo(() => {
		const any = prescriptions.some(p => p.warning);
		if (!any) return null;
		return (
			<Alert severity="warning" sx={{ mb: 2 }}>
				Внимание: у пациента возможны аллергии на некоторые выбранные препараты.
			</Alert>
		);
	}, [prescriptions]);


	const FollowUpServerDay = (props) => {
		const { day, outsideCurrentMonth, ...other } = props;

		if (!day || typeof day.format !== 'function') return <PickersDay {...props} />;

		const dateStr = day.format('YYYY-MM-DD');
		const isToday = day.isSame(dayjs(), 'day');
		const isHoliday = holidays.includes(dateStr);
		const isWeekend = day.day() === 0 || day.day() === 6;
		const hasScheduledAppointment = (allAppointments || []).some(
			(apt) => dayjs(apt.date_time).format('YYYY-MM-DD') === dateStr && apt.status === 'scheduled'
		);


		return (
			<Badge
				key={day.toString()}
				overlap="circular"
				badgeContent={hasScheduledAppointment ? '●' : undefined}
				sx={{
					'& .MuiBadge-badge': {
						fontSize: '10px', color: '#1976d2',
						backgroundColor: 'transparent', right: '50%',
						transform: 'translateX(50%)', top: '20px',
						pointerEvents: 'none',
					}
				}}
			>
				<PickersDay
					{...other}
					day={day}
					outsideCurrentMonth={outsideCurrentMonth}
					disabled={isHoliday || isWeekend}
					sx={{
						backgroundColor: isToday ? '#e8f5e9' : (isHoliday || isWeekend) ? '#ffebee' : undefined,
						color: (isHoliday || isWeekend) ? '#d32f2f' : undefined,
						border: isToday ? '2px solid #4caf50' : undefined,
					}}
				/>
			</Badge>
		);
	};

	if (!appointment) return null;

	return (
		<Modal open={open} onClose={() => onClose(false)}>
			<Box sx={style}>
				<Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Typography variant="h6">Прием пациента: {appointment.patient_details?.first_name} {appointment.patient_details?.last_name}</Typography>
					<IconButton onClick={() => onClose(false)}><CloseIcon /></IconButton>
				</Box>

				<Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
					<Grid container spacing={3}>
						<Grid item xs={12} md={4}>
							<Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
								<Typography variant="subtitle1" sx={{ mb: 1 }}>Информация о пациенте</Typography>
								<Typography variant="body2"><strong>Телефон:</strong> {appointment.patient_details?.phone || '-'}</Typography>
								<Typography variant="body2"><strong>ИИН:</strong> {appointment.patient_details?.iin || '-'}</Typography>
								<Typography variant="body2"><strong>Возраст:</strong> {appointment.patient_details?.age || '-'}</Typography>
								{appointment.patient_details?.allergies && (
									<Alert severity="warning" sx={{ mt: 1, fontSize: '0.75rem' }}>
										Аллергии: {appointment.patient_details.allergies}
									</Alert>
								)}
							</Box>

							<Typography variant="subtitle1" sx={{ mb: 1 }}>История приемов</Typography>
							{history.length === 0 ? (
								<Typography variant="body2" color="text.secondary">Нет завершенных приемов</Typography>
							) : history.slice(0, 5).map((rec) => (
								<Accordion key={rec.appointment_id}>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Typography variant="body2">
											{dayjs(rec.date).format('DD.MM.YYYY')} — {rec.diagnosis || 'Нет диагноза'}
										</Typography>
									</AccordionSummary>
									<AccordionDetails>
										{rec.prescriptions?.length > 0 && (
											<>
												<Typography variant="caption" sx={{ fontWeight: 600 }}>Назначения:</Typography>
												{rec.prescriptions.map(p => (
													<Typography key={p.id} variant="body2">• {p.medicine}</Typography>
												))}
											</>
										)}
									</AccordionDetails>
								</Accordion>
							))}
						</Grid>

						<Grid item xs={12} md={8}>
							<Grid container spacing={2}>
								<Grid item xs={12}>
									<TextField label="Жалобы пациента" fullWidth multiline rows={2}
										value={form.complaints} onChange={e => setForm({ ...form, complaints: e.target.value })} />
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField label="Анамнез" fullWidth multiline rows={2}
										value={form.anamnesis} onChange={e => setForm({ ...form, anamnesis: e.target.value })} />
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField label="Объективные данные" fullWidth multiline rows={2}
										value={form.objective_data} onChange={e => setForm({ ...form, objective_data: e.target.value })} />
								</Grid>

								<Grid item xs={12} md={8}>
									<TextField label="Диагноз" required fullWidth
										value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
								</Grid>
								<Grid item xs={12} md={4}>
									<FormControl fullWidth>
										<InputLabel id="tpl-label">Шаблоны</InputLabel>
										<Select labelId="tpl-label" label="Шаблоны" value="" onChange={(e) => applyTemplate(e.target.value)}>
											<MenuItem value="" disabled>Выберите...</MenuItem>
											{templates.map(t => (
												<MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
											))}
										</Select>
									</FormControl>
								</Grid>

								<Grid item xs={12}>
									<TextField label="Рекомендации" fullWidth multiline rows={2}
										value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} />
								</Grid>

								<Grid item xs={12}>
									<TextField label="Заметки врача (приватно)" fullWidth multiline rows={2}
										value={form.doctor_notes} onChange={e => setForm({ ...form, doctor_notes: e.target.value })} />
								</Grid>
							</Grid>

							<Divider sx={{ my: 2 }} />
							<Typography variant="subtitle1" sx={{ mb: 1 }}><LocalHospitalIcon fontSize="small" sx={{ mr: .5 }} /> Рецепт</Typography>

							{AllergyAlert}

							{prescriptions.map((p, idx) => (
								<Box key={idx} sx={{ p: 2, mb: 1.5, border: '1px solid #e0e0e0', borderRadius: 1 }}>
									<Grid container spacing={1.5}>
										<Grid item xs={12} md={6}>
											<FormControl fullWidth>
												<InputLabel>Препарат</InputLabel>
												<Select label="Препарат" value={p.medicine_id || ''} onChange={(e) => onSelectMedicine(idx, e.target.value)}>
													{medicines.map(m => (
														<MenuItem key={m.id} value={m.id}>
															{m.name}{m.has_allergy ? '  ⚠' : ''}
														</MenuItem>
													))}
												</Select>
											</FormControl>
											{p.warning && <Alert severity="warning" sx={{ mt: 1, fontSize: '0.75rem' }}>{p.warning}</Alert>}
										</Grid>
										<Grid item xs={12} md={6}>
											<TextField label="Дозировка" fullWidth value={p.dosage} onChange={e => updatePrescription(idx, { dosage: e.target.value })} />
										</Grid>
										<Grid item xs={12} md={6}>
											<TextField label="Частота" fullWidth placeholder="3 раза в день" value={p.frequency} onChange={e => updatePrescription(idx, { frequency: e.target.value })} />
										</Grid>
										<Grid item xs={12} md={6}>
											<TextField label="Длительность" fullWidth placeholder="7 дней" value={p.duration} onChange={e => updatePrescription(idx, { duration: e.target.value })} />
										</Grid>
										<Grid item xs={11}>
											<TextField label="Указания" fullWidth value={p.instructions} onChange={e => updatePrescription(idx, { instructions: e.target.value })} />
										</Grid>
										<Grid item xs={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
											<Tooltip title="Удалить"><IconButton onClick={() => removePrescription(idx)}><DeleteIcon /></IconButton></Tooltip>
										</Grid>
									</Grid>
								</Box>
							))}

							<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
								<Button variant="outlined" onClick={addPrescription} startIcon={<AddIcon />}>Добавить</Button>
								<Button variant="outlined" onClick={printPrescriptionPDF} startIcon={<PictureAsPdfIcon />}>PDF</Button>
							</Box>

							<Divider sx={{ my: 2 }} />
							<Typography variant="subtitle1" sx={{ mb: 1 }}><DescriptionIcon fontSize="small" sx={{ mr: .5 }} /> Файлы</Typography>

							<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
								<input
									id="file-input"
									type="file"
									accept=".pdf,.doc,.docx,.jpeg,.jpg,.png"
									style={{ display: 'none' }}
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (!file) return;
										const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
										if (file.size > 5 * 1024 * 1024) {
											setSnack({ open: true, message: 'Размер > 5 МБ', severity: 'error' });
											e.target.value = '';
											return;
										}
										if (!allowed.includes(file.type)) {
											setSnack({ open: true, message: 'Недопустимый формат', severity: 'error' });
											e.target.value = '';
											return;
										}
										setPendingFiles(prev => [...prev, { file, title: file.name, file_type: 'analysis' }]);
										setSnack({ open: true, message: 'Файл добавлен в очередь', severity: 'info' });
										e.target.value = '';
									}}
								/>
								<label htmlFor="file-input">
									<Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} disabled={uploading} size="small">
										Выбрать
									</Button>
								</label>
							</Box>

							{pendingFiles.length > 0 && (
								<Box sx={{ mt: 1 }}>
									{pendingFiles.map((f, i) => (
										<Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
											<DescriptionIcon fontSize="small" />
											<Typography variant="body2">{f.title}</Typography>
											<Chip size="small" label="ожидает" />
											<IconButton size="small" onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}>
												<DeleteIcon fontSize="small" />
											</IconButton>
										</Box>
									))}
								</Box>
							)}

							<Divider sx={{ my: 2 }} />
							<Box sx={{ mb: 2 }}>
								<FormControlLabel
									control={<Checkbox checked={needFollowUp} onChange={(e) => setNeedFollowUp(e.target.checked)} />}
									label={<Typography variant="subtitle1"><EventAvailableIcon fontSize="small" sx={{ mr: .5, verticalAlign: 'middle' }} /> Назначить повторный визит</Typography>}
								/>
							</Box>

							{needFollowUp && (
								<Box sx={{ mt: -1, mb: 2 }}>
									<Grid container spacing={2}>
										<Grid item xs={12} md={6}>
											<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
												<DatePicker
													label="Дата"
													value={followUpDate}
													onChange={(val) => {
														setFollowUpDate(val);
														setFollowUpTime(null);
													}}
													minDate={dayjs().add(1, 'day')}
													maxDate={dayjs().add(3, 'month')}
													slots={{ day: FollowUpServerDay }}
													slotProps={{ textField: { fullWidth: true, required: true, size: 'small' } }}
												/>
											</LocalizationProvider>
										</Grid>

										<Grid item xs={12} md={6}>
											{!followUpDate ? (
												<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Выберите дату</Typography>
											) : loadingSlots ? (
												<Box sx={{ display: 'flex', height: '40px' }}><CircularProgress size={24} /></Box>
											) : availableSlots.length === 0 ? (
												<Alert severity="info">Нет слотов</Alert>
											) : (
												<FormControl fullWidth required size="small">
													<InputLabel>Время</InputLabel>
													<Select label="Время" value={followUpTime || ''} onChange={(e) => setFollowUpTime(e.target.value)}>
														{availableSlots.map((slot, idx) => {
															const time = getSlotTime(slot);
															return <MenuItem key={idx} value={time}>{time}</MenuItem>;
														})}
													</Select>
												</FormControl>
											)}
										</Grid>
									</Grid>
								</Box>
							)}
						</Grid>
					</Grid>
				</Box>

				<Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
					<Button onClick={() => onClose(false)} disabled={saving}>Отмена</Button>
					<Button
						variant="contained"
						onClick={completeReception}
						startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
						disabled={saving || uploading}
					>
						{saving ? 'Сохранение...' : 'Завершить прием'}
					</Button>
				</Box>

				<Snackbar
					open={snack.open}
					autoHideDuration={4000}
					onClose={() => setSnack(s => ({ ...s, open: false }))}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				>
					<Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
						{snack.message}
					</Alert>
				</Snackbar>
			</Box>
		</Modal>
	);
}
