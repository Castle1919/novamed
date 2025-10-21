import React, { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Badge from '@mui/material/Badge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import axios from '../api/axios';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 700,
    maxHeight: '85vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    borderRadius: 2,
    p: 3,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
};

const steps = ['Выберите дату', 'Выберите время', 'Укажите детали'];

export default function AppointmentBookingModal({ open, onClose, doctor }) {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedDateTime, setSelectedDateTime] = useState(null);
    const [notes, setNotes] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [appointmentData, setAppointmentData] = useState(null);
    const [error, setError] = useState('');
    const [myAppointments, setMyAppointments] = useState([]);

    const holidays = [
        '2024-01-01', '2024-01-02', '2024-01-07',
        '2024-03-08', '2024-03-21', '2024-03-22', '2024-03-23',
        '2024-05-01', '2024-05-07', '2024-05-09',
        '2024-07-06', '2024-08-30', '2024-10-25',
        '2024-12-16', '2024-12-17',
        '2025-01-01', '2025-01-02', '2025-01-07',
        '2025-03-08', '2025-03-21', '2025-03-22', '2025-03-23',
        '2025-05-01', '2025-05-07', '2025-05-09',
        '2025-07-06', '2025-08-30', '2025-10-25',
        '2025-12-16', '2025-12-17',
    ];

    dayjs.locale('ru');

    useEffect(() => {
        if (open) {
            resetForm();
            loadMyAppointments();
        }
    }, [open]);

    useEffect(() => {
        if (selectedDate) {
            loadAvailableSlots();
        }
    }, [selectedDate]);

    const resetForm = () => {
        setActiveStep(0);
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedDateTime(null);
        setNotes('');
        setAvailableSlots([]);
        setSuccess(false);
        setAppointmentData(null);
        setError('');
    };

    const loadMyAppointments = async () => {
        try {
            const token = localStorage.getItem('access');
            const response = await axios.get('/appointments/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const data = Array.isArray(response.data) 
                ? response.data 
                : response.data.results || [];
            
            setMyAppointments(data);
        } catch (err) {
            console.error('Error loading my appointments:', err);
        }
    };

    const loadAvailableSlots = async () => {
        if (!selectedDate || !doctor) return;

        setLoading(true);
        setError('');

        try {
            const formattedDate = selectedDate.format('YYYY-MM-DD');
            const response = await axios.get('/appointments/available-slots/', {
                params: {
                    doctor_id: doctor.id,
                    date: formattedDate,
                },
            });

            console.log('=== DEBUG SLOTS ===');
            console.log('Full response:', response.data);
            console.log('Raw slots from server:', response.data.slots);

            if (response.data.success) {
                let slots = response.data.slots;
                
                if (Array.isArray(slots) && slots.length > 0) {
                    if (typeof slots[0] === 'object' && 'available' in slots[0]) {
                        slots = slots.filter(slot => slot.available === true);
                    }
                }
                
                setAvailableSlots(slots || []);
            } else {
                setError('Не удалось загрузить доступные слоты');
                setAvailableSlots([]);
            }
        } catch (err) {
            console.error('Error loading slots:', err);
            setError('Ошибка при загрузке расписания');
            setAvailableSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (activeStep === 0 && !selectedDate) {
            setError('Выберите дату');
            return;
        }
        if (activeStep === 1 && !selectedTime) {
            setError('Выберите время');
            return;
        }
        setError('');
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setError('');
        setActiveStep((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        if (!selectedDate || !selectedTime || !doctor) {
            setError('Заполните все обязательные поля');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const dateTimeString = selectedDateTime || 
                `${selectedDate.format('YYYY-MM-DD')}T${selectedTime}:00`;
            
            const response = await axios.post('/appointments/create/', {
                doctor: doctor.id,
                date_time: dateTimeString,
                notes: notes.trim(),
            });

            if (response.data.success) {
                setSuccess(true);
                setAppointmentData(response.data.appointment);
            } else {
                setError(response.data.message || 'Ошибка при создании записи');
            }
        } catch (err) {
            console.error('Error creating appointment:', err);
            const errorMsg = err.response?.data?.message 
                || err.response?.data?.date_time?.[0]
                || 'Ошибка при создании записи. Попробуйте еще раз.';
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (onClose) onClose(success);
    };

    const getSlotTime = (slot) => {
        if (typeof slot === 'string') {
            return slot;
        }
        return slot.time || slot.datetime?.split('T')[1]?.substring(0, 5) || '00:00';
    };

    const getSlotDateTime = (slot) => {
        if (typeof slot === 'string') {
            return null;
        }
        return slot.datetime || null;
    };

    const ServerDay = (props) => {
        const { day, outsideCurrentMonth, ...other } = props;
        
        if (!day || typeof day.format !== 'function') {
            return <PickersDay {...props} />;
        }

        const dateStr = day.format('YYYY-MM-DD');
        const isToday = day.isSame(dayjs(), 'day');
        const isHoliday = holidays.includes(dateStr);
        const isWeekend = day.day() === 0 || day.day() === 6;
        const hasMyAppointment = myAppointments.some(apt => 
            dayjs(apt.date_time).format('YYYY-MM-DD') === dateStr
        );

        return (
            <Badge
                key={day.toString()}
                overlap="circular"
                badgeContent={hasMyAppointment ? '●' : undefined}
                sx={{
                    '& .MuiBadge-badge': {
                        fontSize: '10px',
                        color: '#ff9800',
                        backgroundColor: 'transparent',
                        right: '50%',
                        transform: 'translateX(50%)',
                        top: '20px',
                        pointerEvents: 'none',
                    }
                }}
            >
                <PickersDay
                    {...other}
                    day={day}
                    outsideCurrentMonth={outsideCurrentMonth}
                    disabled={isHoliday || isWeekend || outsideCurrentMonth}
                    sx={{
                        backgroundColor: isToday ? '#e8f5e9' : 
                                        (isHoliday || isWeekend) ? '#ffebee' : 
                                        undefined,
                        color: (isHoliday || isWeekend) ? '#d32f2f' : undefined,
                        border: isToday ? '2px solid #4caf50' : undefined,
                        fontWeight: isToday ? 'bold' : undefined,
                        '&:hover': {
                            backgroundColor: isToday ? '#c8e6c9' :
                                            (isHoliday || isWeekend) ? '#ffcdd2' : 
                                            undefined,
                        },
                        '&.Mui-disabled': {
                            color: '#bdbdbd',
                            textDecoration: 'line-through',
                        }
                    }}
                />
            </Badge>
        );
    };

    const renderStepContent = (step) => {
        if (success) {
            return (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Вы успешно записаны!
                    </Typography>
                    <Box sx={{ mt: 3, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <PersonIcon color="primary" />
                                    <Typography variant="body1">
                                        <strong>Врач:</strong> {appointmentData?.doctor_details?.name || doctor?.name}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <LocalHospitalIcon color="primary" />
                                    <Typography variant="body1">
                                        <strong>Специализация:</strong> {appointmentData?.doctor_details?.specialization || doctor?.specialization}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <CalendarTodayIcon color="primary" />
                                    <Typography variant="body1">
                                        <strong>Дата:</strong> {selectedDate?.format('DD MMMM YYYY')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <AccessTimeIcon color="primary" />
                                    <Typography variant="body1">
                                        <strong>Время:</strong> {selectedTime}
                                    </Typography>
                                </Box>
                            </Grid>
                            {(appointmentData?.doctor_details?.office_number || doctor?.office_number) && (
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                        <MeetingRoomIcon color="primary" />
                                        <Typography variant="body1">
                                            <strong>Кабинет:</strong> {appointmentData?.doctor_details?.office_number || doctor?.office_number}
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                        Пожалуйста, приходите за 10 минут до назначенного времени
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={handleClose}
                        sx={{ mt: 3 }}
                        size="large"
                    >
                        Закрыть
                    </Button>
                </Box>
            );
        }

        switch (step) {
            case 0:
                return (
                    <Box sx={{ py: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Выберите дату приёма
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Выберите удобную для вас дату визита к врачу
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                            <DatePicker
                                label="Дата приёма"
                                value={selectedDate}
                                onChange={(newValue) => {
                                    setSelectedDate(newValue);
                                    setSelectedTime(null);
                                    setSelectedDateTime(null);
                                    setError('');
                                }}
                                minDate={dayjs()}
                                maxDate={dayjs().add(3, 'month')}
                                slots={{
                                    day: ServerDay,
                                }}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        error: !!error && !selectedDate,
                                        helperText: !selectedDate && error ? error : '',
                                    },
                                }}
                            />
                        </LocalizationProvider>
                        {doctor && (
                            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Выбранный врач:
                                </Typography>
                                <Typography variant="body1">
                                    <strong>{doctor.name}</strong>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {doctor.specialization}
                                </Typography>
                                {doctor.office_number && (
                                    <Typography variant="body2" color="text.secondary">
                                        Кабинет: {doctor.office_number}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                );

            case 1:
                return (
                    <Box sx={{ py: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Выберите время приёма
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Доступные временные слоты на {selectedDate?.format('DD MMMM YYYY')}
                        </Typography>
                        
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : availableSlots.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <AccessTimeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="body1" color="text.secondary">
                                    На выбранную дату нет доступных временных слотов
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Пожалуйста, выберите другую дату
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {availableSlots.map((slot, index) => {
                                    const time = getSlotTime(slot);
                                    const datetime = getSlotDateTime(slot);
                                    
                                    return (
                                        <Grid item xs={6} sm={4} md={3} key={`${time}-${index}`}>
                                            <Chip
                                                label={time}
                                                onClick={() => {
                                                    setSelectedTime(time);
                                                    setSelectedDateTime(datetime);
                                                    setError('');
                                                }}
                                                color={selectedTime === time ? 'primary' : 'default'}
                                                variant={selectedTime === time ? 'filled' : 'outlined'}
                                                icon={<AccessTimeIcon />}
                                                sx={{
                                                    width: '100%',
                                                    height: '48px',
                                                    fontSize: '1rem',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        backgroundColor: selectedTime === time 
                                                            ? 'primary.dark' 
                                                            : 'action.hover',
                                                    },
                                                }}
                                            />
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ py: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Дополнительная информация
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Опишите ваши жалобы или пожелания (необязательно)
                        </Typography>
                        
                        <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Детали записи:
                            </Typography>
                            <Grid container spacing={0.5}>
                                <Grid item xs={12}>
                                    <Typography variant="body2">
                                        <strong>Врач:</strong> {doctor?.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2">
                                        <strong>Специализация:</strong> {doctor?.specialization}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2">
                                        <strong>Дата:</strong> {selectedDate?.format('DD MMMM YYYY')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2">
                                        <strong>Время:</strong> {selectedTime}
                                    </Typography>
                                </Grid>
                                {doctor?.office_number && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2">
                                            <strong>Кабинет:</strong> {doctor.office_number}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Ваши жалобы или пожелания"
                            placeholder="Опишите симптомы, жалобы или укажите цель визита..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            variant="outlined"
                        />
                        
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Это поле необязательное, но поможет врачу лучше подготовиться к приёму
                        </Typography>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Modal
            open={open}
            onClose={success ? handleClose : () => handleClose()}
            aria-labelledby="appointment-modal-title"
        >
            <Box sx={style}>
                {!success && (
                    <>
                        <Typography id="appointment-modal-title" variant="h5" component="h2" gutterBottom>
                            Запись на приём
                        </Typography>
                        <Stepper activeStep={activeStep} sx={{ pt: 1, pb: 2 }}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </>
                )}

                {error && (
                    <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#ffebee', borderRadius: 1, border: '1px solid #ef5350' }}>
                        <Typography color="error" variant="body2">
                            ⚠️ {error}
                        </Typography>
                    </Box>
                )}

                <Box sx={{ flex: 1, minHeight: 0 }}>
                    {renderStepContent(activeStep)}
                </Box>

                {!success && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                        <Button
                            onClick={activeStep === 0 ? handleClose : handleBack}
                            disabled={submitting}
                            variant="outlined"
                        >
                            {activeStep === 0 ? 'Отмена' : 'Назад'}
                        </Button>
                        <Box>
                            {activeStep === steps.length - 1 ? (
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    startIcon={submitting ? <CircularProgress size={20} /> : null}
                                    size="large"
                                >
                                    {submitting ? 'Создание записи...' : 'Записаться'}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={handleNext}
                                    disabled={
                                        (activeStep === 0 && !selectedDate) ||
                                        (activeStep === 1 && (!selectedTime || loading))
                                    }
                                    size="large"
                                >
                                    Далее
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </Modal>
    );
}