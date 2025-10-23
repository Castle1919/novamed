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
import { Alert, CircularProgress } from '@mui/material';

const style = {
	position: 'absolute', top: '50%', left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 400, bgcolor: 'background.paper', boxShadow: 24,
	textAlign: 'center', borderRadius: 2, pt: 2, px: 4, pb: 3,
};

function Registr({ onClose }) {
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	const validationSchema = yup.object().shape({
		firstName: yup.string().required('Имя обязательно'),
		lastName: yup.string().required('Фамилия обязательна'),
		email: yup.string().email('Неверный формат email').required('Email обязателен'),
		password: yup.string().min(8, 'Минимум 8 символов').required('Пароль обязателен'),
		confirmPassword: yup.string()
			.oneOf([yup.ref('password'), null], 'Пароли должны совпадать')
			.required('Подтвердите пароль'),
	});

	const initialValues = {
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		confirmPassword: '',
	};

	const onSubmit = async (values, { setSubmitting }) => {
		setSubmitting(true);
		setError('');
		setSuccessMessage('');

		try {
			// Отправляем данные на бэкенд
			await api.post('/accounts/register/', {
				username: values.email, // Используем email как username
				email: values.email,
				password: values.password,
				first_name: values.firstName,
				last_name: values.lastName,
			});

			// Показываем сообщение об успехе
			setSuccessMessage("Регистрация почти завершена! Мы отправили письмо с ссылкой для активации на вашу почту. Пожалуйста, проверьте папку 'Входящие' и 'Спам'.");

		} catch (err) {
			const errorData = err.response?.data;
			let errorMessage = 'Произошла ошибка при регистрации.';
			if (errorData) {
				// Пытаемся найти конкретную ошибку
				if (errorData.email) errorMessage = `Email: ${errorData.email[0]}`;
				else if (errorData.username) errorMessage = `Пользователь с таким email уже существует.`;
			}
			setError(errorMessage);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			open={true}
			onClose={onClose}
			aria-labelledby="parent-modal-title"
		>
			<Box sx={{ ...style, width: 400 }}>
				<h2 id="parent-modal-title">Регистрация пациента</h2>
				
				{/* Если есть сообщение об успехе, показываем только его */}
				{successMessage ? (
					<Box sx={{ mt: 2 }}>
						<Alert severity="success">{successMessage}</Alert>
						<Button onClick={onClose} variant="contained" sx={{ mt: 3 }}>
							Отлично!
						</Button>
					</Box>
				) : (
					<>
						{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
						<Formik
							initialValues={initialValues}
							validationSchema={validationSchema}
							onSubmit={onSubmit}
						>
							{({ isSubmitting }) => (
								<Form className="reg-form">
									<Field name="firstName">
										{({ field, meta }) => (
											<TextField
												{...field}
												fullWidth margin="normal" label="Имя"
												error={meta.touched && Boolean(meta.error)}
												helperText={meta.touched && meta.error}
											/>
										)}
									</Field>
									<Field name="lastName">
										{({ field, meta }) => (
											<TextField
												{...field}
												fullWidth margin="normal" label="Фамилия"
												error={meta.touched && Boolean(meta.error)}
												helperText={meta.touched && meta.error}
											/>
										)}
									</Field>
									<Field name="email">
										{({ field, meta }) => (
											<TextField
												{...field}
												fullWidth margin="normal" label="Email" type="email"
												error={meta.touched && Boolean(meta.error)}
												helperText={meta.touched && meta.error}
											/>
										)}
									</Field>
									<Field name="password">
										{({ field, meta }) => (
											<TextField
												{...field}
												fullWidth margin="normal" label="Пароль"
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
									<Field name="confirmPassword">
										{({ field, meta }) => (
											<TextField
												{...field}
												fullWidth margin="normal" label="Подтвердите пароль"
												type={showPassword ? 'text' : 'password'}
												error={meta.touched && Boolean(meta.error)}
												helperText={meta.touched && meta.error}
											/>
										)}
									</Field>

									<Button
										type="submit"
										variant="contained"
										disabled={isSubmitting}
										fullWidth sx={{ mt: 2, py: 1.5 }}
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