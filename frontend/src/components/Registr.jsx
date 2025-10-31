import React, { useState } from 'react';
import '../App.css';
import {
    Modal, Box, Typography, TextField, Button, CircularProgress,
    Alert, Grid, IconButton, InputAdornment, MenuItem
} from '@mui/material';
import { Formik, Field, Form } from 'formik';
import * as yup from 'yup';
import api from '../api/axios';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import KZimg from '../assets/kz.png';
import { useTranslation } from 'react-i18next';

const style = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%', maxWidth: 500,
    bgcolor: 'background.paper', boxShadow: 24,
    textAlign: 'center', borderRadius: 2,
    p: { xs: 2, sm: 3, md: 4 },
};

// Общая валидация для всех
const baseValidationSchema = {
    firstName: yup.string().required('Имя обязательно'),
    lastName: yup.string().required('Фамилия обязательна'),
    email: yup.string().email('Неверный формат email').required('Email обязателен'),
    phone: yup.string()
        .matches(/^\+?[7][0-9]{10}$/, 'Номер должен начинаться с +7 и содержать 11 цифр')
        .required('Телефон обязателен'),
    password: yup.string().min(8, 'Минимум 8 символов').required('Пароль обязателен'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('password'), null], 'Пароли должны совпадать')
        .required('Подтвердите пароль'),
};

// Валидация для врача
const doctorValidationSchema = yup.object().shape({
    ...baseValidationSchema,
    specialty: yup.string().required('Специализация обязательна'),
});

// Валидация для пациента
const patientValidationSchema = yup.object().shape({
    ...baseValidationSchema,
    iin: yup.string().matches(/^[0-9]{12}$/, 'ИИН должен содержать 12 цифр').required('ИИН обязателен'),
});

function Registr({ onClose, role = 'patient' }) {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { t } = useTranslation();
    const isDoctor = role === 'doctor';

    const initialValues = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        specialty: '',
        iin: '',
    };

    const onSubmit = async (values, { setSubmitting }) => {
        setSubmitting(true);
        setError('');
        setSuccessMessage('');

        try {
            const payload = {
                username: values.email,
                email: values.email,
                password: values.password,
                first_name: values.firstName,
                last_name: values.lastName,
                phone: values.phone,
                is_doctor: isDoctor,
                is_patient: !isDoctor,
                ...(isDoctor && { specialty: values.specialty }),
                ...(!isDoctor && { iin: values.iin }),
            };

            await api.post('/accounts/register/', payload);
            setSuccessMessage(t('registr.success'));
        } catch (err) {
            const errorData = err.response?.data;
            let errorMessage = 'Произошла ошибка при регистрации.';
            if (errorData) {
                if (errorData.email) errorMessage = `Email: ${errorData.email[0]}`;
                else if (errorData.phone) errorMessage = `Телефон: ${errorData.phone[0]}`;
                else if (errorData.username) errorMessage = `Пользователь с таким email уже существует.`;
            }
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal open={true} onClose={onClose}>
            <Box sx={style}>
                <h2>{isDoctor ? t('registr.title_doctor') : t('registr.title_patient')}</h2>

                {successMessage ? (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="success" sx={{ textAlign: 'left' }}>{successMessage}</Alert>
                        <Button onClick={onClose} variant="contained" sx={{ mt: 3 }}>
                            Отлично!
                        </Button>
                    </Box>
                ) : (
                    <>
                        {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}
                        <Formik
                            initialValues={initialValues}
                            validationSchema={isDoctor ? doctorValidationSchema : patientValidationSchema}
                            onSubmit={onSubmit}
                        >
                            {({ isSubmitting }) => (
                                <Form>
                                    <Box sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 2, pl: 1 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Field name="firstName">
                                                    {({ field, meta }) => <TextField {...field} fullWidth label={t('registr.name')} error={meta.touched && Boolean(meta.error)} helperText={meta.touched && meta.error} />}
                                                </Field>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Field name="lastName">
                                                    {({ field, meta }) => <TextField {...field} fullWidth label={t('registr.last_name')} error={meta.touched && Boolean(meta.error)} helperText={meta.touched && meta.error} />}
                                                </Field>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Field name="email">
                                                    {({ field, meta }) => <TextField {...field} fullWidth label="Email" type="email" error={meta.touched && Boolean(meta.error)} helperText={meta.touched && meta.error} />}
                                                </Field>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Field name="phone">
                                                    {({ field, meta }) => <TextField {...field} fullWidth label={t('registr.phone_number')} placeholder="+77071234567" error={meta.touched && Boolean(meta.error)} helperText={meta.touched && meta.error} InputProps={{ startAdornment: (<InputAdornment position="start"><img src={KZimg} alt="KZ" style={{ width: '24px', marginRight: '5px' }} /></InputAdornment>), }} />}
                                                </Field>
                                            </Grid>

                                            {isDoctor ? (
                                                <Grid item xs={12}>
                                                    <Field name="specialty">
                                                        {({ field, meta }) => <TextField {...field} fullWidth label={t('registr.specialization')} error={meta.touched && Boolean(meta.error)} helperText={meta.touched && meta.error} />}
                                                    </Field>
                                                </Grid>
                                            ) : (
                                                <Grid item xs={12}>
                                                    <Field name="iin">
                                                        {({ field, meta }) => <TextField {...field} fullWidth label={t('registr.iin')} error={meta.touched && Boolean(meta.error)} helperText={meta.touched && meta.error} />}
                                                    </Field>
                                                </Grid>
                                            )}

                                            <Grid item xs={12}>
                                                <Field name="password">
                                                    {({ field, meta }) => <TextField {...field} fullWidth label={t('registr.password')} type={showPassword ? 'text' : 'password'} error={meta.touched && Boolean(meta.error)} helperText={meta.touched && meta.error} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment>), }} />}
                                                </Field>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Field name="confirmPassword">
                                                    {({ field, meta }) => <TextField {...field} fullWidth label={t('registr.confirm_password')} type={showPassword ? 'text' : 'password'} error={meta.touched && Boolean(meta.error)} helperText={meta.touched && meta.error} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment>), }} />}
                                                </Field>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth sx={{ mt: 3, py: 1.5 }} startIcon={isSubmitting ? <CircularProgress size={20} /> : null}>
                                        {isSubmitting ? t('registr.submiting') : t('registr.submit')}
                                    </Button>
                                </Form>
                            )}
                        </Formik>
                    </>
                )}
            </Box>
        </Modal>
    );
}

export default Registr;