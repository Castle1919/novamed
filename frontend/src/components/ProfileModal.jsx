import React, { useState, useEffect } from 'react';
import {
    Modal, Box, Typography, TextField, Button, CircularProgress, Alert,
    InputAdornment, Chip, Grid
} from '@mui/material';
import axios from '../api/axios';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

const style = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%', maxWidth: 700,
    bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2,
    p: 3,
};

export default function ProfileModal({ open, onClose, role }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [codeSent, setCodeSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    useEffect(() => {
        if (open) {
            const fetchProfile = async () => {
                setLoading(true);
                setError(''); setSuccess(''); setCodeSent(false);
                try {
                    const endpoint = role === 'doctor' ? '/doctors/me/' : '/patients/me/';
                    const response = await axios.get(endpoint);
                    setProfile(response.data);
                } catch (err) {
                    setError('Не удалось загрузить профиль.');
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }
    }, [open, role]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Если это поле из User, обновляем user
        if (['email', 'phone'].includes(name)) {
            setProfile(p => ({ ...p, user: { ...p.user, [name]: value } }));
        } else {
            setProfile(p => ({ ...p, [name]: value }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(''); setSuccess('');
        try {
            const payload = {
                // Данные для User
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.user?.email,
                phone: profile.user?.phone,

                // Данные для Patient/Doctor профиля
                birth_date: profile.birth_date,
                iin: profile.iin,
                gender: profile.gender,
                // Дополнительные поля для пациента
                height: profile.height,
                weight: profile.weight,
                chronic_diseases: profile.chronic_diseases,
                allergies: profile.allergies,
                blood_type: profile.blood_type,
                // Дополнительные поля для врача
                specialty: profile.specialty,
                experience_years: profile.experience_years,
                work_phone: profile.work_phone,
            };

            // Используем разные эндпоинты для сохранения
            const updateEndpoint = role === 'doctor' ? `/doctors/${profile.id}/` : `/patients/${profile.id}/`;
            await axios.patch(updateEndpoint, payload);

            setSuccess('Профиль успешно обновлен!');
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = Object.values(errorData).flat().join(' ') || 'Ошибка при сохранении.';
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleSendCode = async () => {
        try {
            await axios.post('/accounts/phone/send-verification/');
            setCodeSent(true);
            setSuccess('Код отправлен на ваш номер телефона.');
        } catch (err) {
            setError('Не удалось отправить код.');
        }
    };

    const handleVerifyCode = async () => {
        try {
            await axios.post('/accounts/phone/verify/', { code: verificationCode });
            setSuccess('Номер успешно подтвержден!');
            onClose(true); // Закрываем и обновляем
        } catch (err) {
            setError('Неверный код.');
        }
    };

    return (
        <Modal open={open} onClose={() => onClose(false)}>
            <Box sx={style}>
                {/* Шапка с заголовком и крестиком */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    pr: 1, // Отступ для крестика
                }}>
                    <Typography variant="h5" gutterBottom component="div" sx={{ m: 0 }}>
                        Изменить профиль
                    </Typography>
                    <IconButton onClick={() => onClose(false)}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                        {/* Контент с полями и скроллом */}
                        <Box sx={{ flex: 1, overflowY: 'auto', pr: 2, minHeight: 0 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField name="first_name" label="Имя" value={profile.first_name || ''} onChange={handleChange} fullWidth />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField name="last_name" label="Фамилия" value={profile.last_name || ''} onChange={handleChange} fullWidth />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField name="email" label="Email" value={profile.user?.email || ''} onChange={handleChange} fullWidth />
                                </Grid>
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
                                                        <Button onClick={handleSendCode} size="small">Код</Button>
                                                    )}
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>

                                {/* Поля для всех */}
                                <Grid item xs={12} sm={6}>
                                    <TextField name="iin" label="ИИН" value={profile.iin || ''} onChange={handleChange} fullWidth />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField name="birth_date" label="Дата рождения" type="date" value={profile.birth_date || ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                                </Grid>

                                {/* Поля только для пациента */}
                                {role === 'patient' && (
                                    <>
                                        <Grid item xs={12} sm={6}><TextField name="height" label="Рост (см)" type="number" value={profile.height || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="weight" label="Вес (кг)" type="number" value={profile.weight || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12}><TextField name="chronic_diseases" label="Хронические заболевания" value={profile.chronic_diseases || ''} onChange={handleChange} fullWidth multiline rows={2} /></Grid>
                                        <Grid item xs={12}><TextField name="allergies" label="Аллергии" value={profile.allergies || ''} onChange={handleChange} fullWidth multiline rows={2} /></Grid>
                                    </>
                                )}

                                {/* Поля только для врача */}
                                {role === 'doctor' && (
                                    <>
                                        <Grid item xs={12} sm={6}><TextField name="specialty" label="Специализация" value={profile.specialty || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="experience_years" label="Стаж (лет)" type="number" value={profile.experience_years || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12}><TextField name="work_phone" label="Рабочий телефон" value={profile.work_phone || ''} onChange={handleChange} fullWidth /></Grid>
                                    </>
                                )}

                                {codeSent && !profile.user?.phone_verified && (
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                                            <TextField label="Код из SMS" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} size="small" />
                                            <Button onClick={handleVerifyCode} variant="contained" size="small">Подтвердить</Button>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>

                        {/* Футер с кнопками */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
                            <Button onClick={() => onClose(false)} variant="outlined">
                                Отмена
                            </Button>
                            <Button onClick={handleSave} variant="contained" disabled={saving}>
                                {saving ? <CircularProgress size={24} /> : 'Сохранить изменения'}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </Modal>
    );
}