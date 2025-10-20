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
import { useNavigate } from 'react-router-dom';
import { Formik, Field, Form } from 'formik';
import * as yup from 'yup';
import axios from '../api/axios';
import { setTokens } from '../api';

const style = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 400,
	bgcolor: 'background.paper',
	boxShadow: 24,
	textAlign: 'center',
	borderRadius: 2,
	pt: 2,
	px: 4,
	pb: 3,
};

function Login({ onClose }) {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');

	const validationSchema = yup.object().shape({
		email: yup.string().email('Неверный формат email').required('Обязательное поле'),
		password: yup.string().min(8, 'Минимальная длина пароля - 8 символов').required('Обязательное поле'),
	});

	const initialValues = {
		email: '',
		password: '',
	};

	const onSubmit = async (values, { setSubmitting }) => {
		setError('');
		setSubmitting(true);

		try {
			const response = await axios.post('/accounts/login/', {
				username: values.email,
				email: values.email,
				password: values.password,
			});

			// Декодируем payload токена для получения роли
			try {
				const payload = JSON.parse(atob(response.data.access.split('.')[1]));
				const role = payload.role || 'user';
				
				// Сохраняем токены
				setTokens({ 
					access: response.data.access, 
					refresh: response.data.refresh, 
					role: role 
				});

				// Устанавливаем заголовок Authorization для axios
				axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;

				// Закрываем модальное окно
				if (onClose) onClose();

				// Редирект в зависимости от роли
				if (role === 'patient') {
					navigate('/patient/main');
				} else if (role === 'doctor') {
					navigate('/doctor/main');
				} else {
					navigate('/');
				}
				
				// Перезагружаем страницу для обновления состояния
				window.location.reload();
				
			} catch (e) {
				console.error('Error decoding token:', e);
				setError('Ошибка при обработке токена');
			}

		} catch (err) {
			const msg = err.response?.data?.detail || err.response?.data || err.message || 'Ошибка входа';
			setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
			console.error('Login error:', err.response?.status, err.response?.data, err.message);
		}

		setSubmitting(false);
	};

	return (
		<Modal open={true} onClose={onClose} aria-labelledby="patient-login-modal-title">
			<Box sx={{ ...style, width: 400 }}>
				<h2 id="patient-login-modal-title">Вход</h2>

				{error && (
					<div style={{ 
						color: '#d32f2f', 
						backgroundColor: '#ffebee', 
						padding: '10px', 
						borderRadius: '4px',
						marginBottom: '16px'
					}}>
						{error}
					</div>
				)}

				<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
					{({ isSubmitting }) => (
						<Form className="reg-form">
							<div className="reg-form-inps">
								<Field name="email">
									{({ field, meta }) => (
										<TextField
											{...field}
											label="Почта"
											variant="outlined"
											className="reg-form-inp"
											error={meta.touched && Boolean(meta.error)}
											helperText={meta.touched ? meta.error : ''}
											disabled={isSubmitting}
										/>
									)}
								</Field>
							</div>

							<div className="reg-form-inps">
								<Field name="password">
									{({ field, meta }) => (
										<TextField
											{...field}
											label="Пароль"
											variant="outlined"
											type={showPassword ? 'text' : 'password'}
											className="reg-form-inp"
											error={meta.touched && Boolean(meta.error)}
											helperText={meta.touched ? meta.error : ''}
											disabled={isSubmitting}
											InputProps={{
												endAdornment: (
													<InputAdornment position="end">
														<IconButton
															aria-label="toggle password visibility"
															onClick={() => setShowPassword(!showPassword)}
															edge="end"
															disabled={isSubmitting}
														>
															{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
														</IconButton>
													</InputAdornment>
												),
											}}
										/>
									)}
								</Field>
							</div>

							<Button 
								type="submit" 
								variant="contained" 
								id="extForRegistr"
								disabled={isSubmitting}
							>
								{isSubmitting ? 'Вход...' : 'Войти'}
							</Button>
						</Form>
					)}
				</Formik>
			</Box>
		</Modal>
	);
}

export default Login;