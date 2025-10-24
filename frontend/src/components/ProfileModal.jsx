import React, { useState, useEffect } from 'react';
import {
    Modal, Box, Typography, TextField, Button, CircularProgress, Alert,
    InputAdornment, Chip, Grid, IconButton, MenuItem, Snackbar, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from '../api/axios';

const style = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%', maxWidth: 800,
    maxHeight: '90vh',
    bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2,
    p: 0,
    display: 'flex', flexDirection: 'column',
};

const genderOptions = [
    { value: 'M', label: 'Мужской' },
    { value: 'F', label: 'Женский' },
];

const bloodTypeOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfileModal({ open, onClose, role }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({});
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

    const [codeSent, setCodeSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    useEffect(() => {
        if (open) {
            const fetchProfile = async () => {
                setLoading(true);
                setCodeSent(false); // Сбрасываем состояние при открытии
                try {
                    const endpoint = role === 'doctor' ? '/doctors/me/' : '/patients/me/';
                    const response = await axios.get(endpoint);
                    setProfile(response.data);
                } catch (err) {
                    setSnack({ open: true, message: 'Не удалось загрузить профиль', severity: 'error' });
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }
    }, [open, role]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (['email', 'phone'].includes(name)) {
            setProfile(p => ({ ...p, user: { ...p.user, [name]: value } }));
        } else {
            setProfile(p => ({ ...p, [name]: value }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                first_name: profile.first_name,
                last_name: profile.last_name,
                birth_date: profile.birth_date,
                iin: profile.iin,
                user: {
                    email: profile.user?.email,
                    phone: profile.user?.phone,
                },
                ...(role === 'patient' && {
                    gender: profile.gender, height: profile.height, weight: profile.weight,
                    chronic_diseases: profile.chronic_diseases, allergies: profile.allergies,
                    blood_type: profile.blood_type, insurance_number: profile.insurance_number,
                    emergency_contact: profile.emergency_contact,
                }),
                ...(role === 'doctor' && {
                    specialty: profile.specialty, experience_years: profile.experience_years,
                    work_phone: profile.work_phone, license_number: profile.license_number,
                    department: profile.department, office_number: profile.office_number,
                })
            };

            const updateEndpoint = role === 'doctor' ? `/doctors/${profile.id}/` : `/patients/${profile.id}/`;
            await axios.patch(updateEndpoint, payload);

            setSnack({ open: true, message: 'Профиль успешно обновлен!', severity: 'success' });
            setTimeout(() => onClose(true), 1500);

        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(' ') : value}`).join('; ') : 'Ошибка при сохранении.';
            setSnack({ open: true, message: errorMessage, severity: 'error' });
            setSaving(false);
        }
    };

    const handleSendCode = async () => {
        try {
            await axios.post('/accounts/phone/send-verification/');
            setCodeSent(true);
            setSnack({ open: true, message: 'Код отправлен на ваш номер', severity: 'info' });
        } catch (err) {
            setSnack({ open: true, message: 'Не удалось отправить код', severity: 'error' });
        }
    };

    const handleVerifyCode = async () => {
        try {
            await axios.post('/accounts/phone/verify/', { code: verificationCode });
            setProfile(p => ({ ...p, user: { ...p.user, phone_verified: true } }));
            setCodeSent(false);
            setSnack({ open: true, message: 'Номер успешно подтвержден!', severity: 'success' });
        } catch (err) {
            setSnack({ open: true, message: 'Неверный код', severity: 'error' });
        }
    };

    const handleCloseSnack = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnack({ ...snack, open: false });
    };

    return (
        <Modal open={open} onClose={() => onClose(false)}>
            <Box sx={style}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
                    <Typography variant="h6">Изменить профиль</Typography>
                    <IconButton onClick={() => onClose(false)}><CloseIcon /></IconButton>
                </Box>

                <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Divider><Chip label="Основная информация" size="small" /></Divider></Grid>
                                <Grid item xs={12} sm={6}><TextField name="first_name" label="Имя" value={profile.first_name || ''} onChange={handleChange} fullWidth /></Grid>
                                <Grid item xs={12} sm={6}><TextField name="last_name" label="Фамилия" value={profile.last_name || ''} onChange={handleChange} fullWidth /></Grid>
                                <Grid item xs={12} sm={6}><TextField name="birth_date" label="Дата рождения" type="date" value={profile.birth_date || ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                                <Grid item xs={12} sm={6}><TextField name="iin" label="ИИН" value={profile.iin || ''} onChange={handleChange} fullWidth /></Grid>

                                <Grid item xs={12}><Divider sx={{ mt: 2 }}><Chip label="Контактные данные" size="small" /></Divider></Grid>
                                <Grid item xs={12} sm={6}><TextField name="email" label="Email" value={profile.user?.email || ''} onChange={handleChange} fullWidth /></Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        name="phone"
                                        label="Телефон"
                                        value={profile.user?.phone || ''}
                                        onChange={handleChange}
                                        fullWidth
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    {profile.user?.phone_verified ? (
                                                        <Chip label="Подтвержден" color="success" size="small" />
                                                    ) : (
                                                        <Button onClick={handleSendCode} size="small" disabled={codeSent}>Код</Button>
                                                    )}
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>
                                {codeSent && !profile.user?.phone_verified && (
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                                            <TextField label="Код из SMS" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} size="small" />
                                            <Button onClick={handleVerifyCode} variant="contained" size="small">Подтвердить</Button>
                                        </Box>
                                    </Grid>
                                )}

                                {role === 'patient' && (
                                    <>
                                        <Grid item xs={12}><Divider sx={{ mt: 2 }}><Chip label="Медицинские данные" size="small" /></Divider></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="height" label="Рост (см)" type="number" value={profile.height || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="weight" label="Вес (кг)" type="number" value={profile.weight || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField name="blood_type" label="Группа крови" value={profile.blood_type || ''} onChange={handleChange} fullWidth select>
                                                {bloodTypeOptions.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField name="gender" label="Пол" value={profile.gender || ''} onChange={handleChange} fullWidth select>
                                                {genderOptions.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12}><TextField name="chronic_diseases" label="Хронические заболевания" value={profile.chronic_diseases || ''} onChange={handleChange} fullWidth multiline rows={2} /></Grid>
                                        <Grid item xs={12}><TextField name="allergies" label="Аллергии" value={profile.allergies || ''} onChange={handleChange} fullWidth multiline rows={2} /></Grid>
                                        <Grid item xs={12}><Divider sx={{ mt: 2 }}><Chip label="Дополнительно" size="small" /></Divider></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="insurance_number" label="Номер страховки" value={profile.insurance_number || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="emergency_contact" label="Экстренный контакт" value={profile.emergency_contact || ''} onChange={handleChange} fullWidth /></Grid>
                                    </>
                                )}

                                {role === 'doctor' && (
                                    <>
                                        <Grid item xs={12}><Divider sx={{ mt: 2 }}><Chip label="Профессиональные данные" size="small" /></Divider></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="specialty" label="Специализация" value={profile.specialty || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="experience_years" label="Стаж (лет)" type="number" value={profile.experience_years || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="work_phone" label="Рабочий телефон" value={profile.work_phone || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="office_number" label="Номер кабинета" value={profile.office_number || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="license_number" label="Номер лицензии" value={profile.license_number || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="department" label="Отделение" value={profile.department || ''} onChange={handleChange} fullWidth /></Grid>
                                    </>
                                )}
                            </Grid>
                        </>
                    )}
                </Box>

                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
                    <Button onClick={() => onClose(false)} variant="outlined" disabled={saving}>Отмена</Button>
                    <Button onClick={handleSave} variant="contained" disabled={saving}>
                        {saving ? <CircularProgress size={24} /> : 'Сохранить'}
                    </Button>
                </Box>

                <Snackbar
                    open={snack.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnack}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={handleCloseSnack} severity={snack.severity} sx={{ width: '100%' }}>
                        {snack.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Modal>
    );
}