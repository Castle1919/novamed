import React, { useState } from 'react';
import '../App.css';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Formik, Field, Form } from 'formik';
import * as yup from 'yup';
import api from '../api/axios';
import { Alert, CircularProgress, Grid } from '@mui/material';
import KZimg from '../assets/kz.png';

const style = {
	position: 'absolute', top: '50%', left: '50%',
	transform: 'translate(-50%, -50%)',
	width: '90%', maxWidth: 500,
	bgcolor: 'background.paper', boxShadow: 24,
	textAlign: 'center', borderRadius: 2, 
    p: { xs: 2, sm: 3, md: 4 },
};

function Registr({ onClose }) {
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	const validationSchema = yup.object().shape({
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
	});

	const initialValues = {
		firstName: '',
		lastName: '',
		email: '',
        phone: '',
		password: '',
		confirmPassword: '',
	};

	const onSubmit = async (values, { setSubmitting }) => {
		setSubmitting(true);
		setError('');
		setSuccessMessage('');

		try {
			await api.post('/accounts/register/', {
				username: values.email,
				email: values.email,
				password: values.password,
				first_name: values.firstName,
				last_name: values.lastName,
                phone: values.phone,
			});
			setSuccessMessage("Регистрация почти завершена! Мы отправили письмо с ссылкой для активации на вашу почту. Пожалуйста, проверьте папку 'Входящие' и 'Спам'.");
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
				<h2>Регистрация пациента</h2>
				
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
							validationSchema={validationSchema}
							onSubmit={onSubmit}
						>
							{({ isSubmitting }) => (
								<Form>
                                    <Box sx={{ maxHeight: '60vh', overflowY: 'auto'}}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Field name="firstName">
                                                    {({ field, meta }) => (
                                                        <TextField {...field} fullWidth label="Имя" error={meta.touched && Boolean(meta.error)} helperText={meta.touched && meta.error} />
                                                    )}
                                                </Field>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Field name="lastName">
                                                    {({ field, meta }) => (
                                                        <TextField {...field} fullWidth label="Фамилия" error={meta.touched && Boolean(meta.error)} helperText={meta.touched && meta.error} />
                                                    )}
                                                </Field>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Field name="email">
                                                    {({ field, meta }) => (
                                                        <TextField {...field} fullWidth label="Email" type="email" error={meta.touched && Boolean(meta.error)} helperText={meta.touched && meta.error} />
                                                    )}
                                                </Field>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Field name="phone">
                                                    {({ field, meta }) => (
                                                        <TextField
                                                            {...field}
                                                            fullWidth label="Номер телефона"
                                                            placeholder="+77071234567"
                                                            error={meta.touched && Boolean(meta.error)}
                                                            helperText={meta.touched && meta.error}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <img src={KZimg} alt="KZ" style={{ width: '24px', marginRight: '5px' }} />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    )}
                                                </Field>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Field name="password">
                                                    {({ field, meta }) => (
                                                        <TextField
                                                            {...field}
                                                            fullWidth label="Пароль"
                                                            type={showPassword ? 'text' : 'password'}
                                                            error={meta.touched && Boolean(meta.error)}
                                                            helperText={meta.touched && meta.error}
                                                            InputProps={{
                                                                endAdornment: (
                                                                    <InputAdornment position="end">
                                                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                                        </IconButton>
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    )}
                                                </Field>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Field name="confirmPassword">
                                                    {({ field, meta }) => (
                                                        <TextField
                                                            {...field}
                                                            fullWidth label="Подтвердите пароль"
                                                            type={showPassword ? 'text' : 'password'}
                                                            error={meta.touched && Boolean(meta.error)}
                                                            helperText={meta.touched && meta.error}
                                                            InputProps={{
                                                                endAdornment: (
                                                                    <InputAdornment position="end">
                                                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                                        </IconButton>
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    )}
                                                </Field>
                                            </Grid>
                                        </Grid>
                                    </Box>

									<Button
										type="submit" variant="contained"
										disabled={isSubmitting}
										fullWidth sx={{ mt: 3, py: 1.5 }}
										startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
									>
										{isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
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