import React, { useState } from 'react';
import '../App.css';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Formik, Field, Form } from 'formik';
import * as yup from 'yup';
import KZimg from '../assets/kz.png';
import api from '../api/axios';
import { login, setTokens } from '../api';
// import { useSelector, useDispatch } from 'react-redux'
// import { setImage } from '../components/ModalSlice'

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

function Registr({ onClose }) {
	// const dispatch = useDispatch()

	const [open, setOpen] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');

	const handleOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
		onClose();
	};

	const validationSchema = yup.object().shape({
		name: yup.string().required('Обязательное поле'),
		email: yup.string().email('Неверный формат email').required('Обязательное поле'),
		number: yup
			.string()
			.min(11, 'Минимальная длина - 11 символов')
			.max(11, 'Максимальная длина - 11 символов')
			.required('Обязательное поле'),
		password: yup
			.string()
			.min(8, 'Минимальная длина пароля - 8 символов')
			.required('Обязательное поле'),
		first_name: yup.string().required('Обязательное поле'),
		last_name: yup.string().required('Обязательное поле'),
		birth_date: yup.date().required('Обязательное поле'),
		iin: yup.string().matches(/^[0-9]{12}$/, 'ИИН должен содержать 12 цифр').required('Обязательное поле'),
	});

	const initialValues = {
		name: '',
		email: '',
		number: '',
		password: '',
		first_name: '',
		last_name: '',
		birth_date: '',
		gender: 'M',
		iin: '',
	};

	const onSubmit = async (values, { setSubmitting }) => {
		setSubmitting(true);
		setError('');
		try {
			// create user with patient profile
			const payload = {
				username: values.name,
				email: values.email,
				password: values.password,
				is_patient: true,
				first_name: values.first_name,
				last_name: values.last_name,
				birth_date: values.birth_date,
				gender: values.gender,
				iin: values.iin,
				phone: values.number,
			};
			await api.post('/accounts/register/', payload);

			// auto-login
			const data = await login(values.name, values.password);
			const tokenPayload = JSON.parse(atob(data.access.split('.')[1]));
			setTokens({ access: data.access, refresh: data.refresh, role: tokenPayload.role });

			handleOpen();
		} catch (err) {
			console.error('Registration error:', err);
			setError(err.response?.data || err.message || 'Ошибка регистрации');
		}
		setSubmitting(false);
	};

	// async uniqueness check
	const checkUnique = async (field, value) => {
		if (!value) return null;
		try {
			const params = {};
			params[field] = value;
			const resp = await api.get('/patients/check_unique/', { params });
			return resp.data.exists;
		} catch (err) {
			console.error('Error checking uniqueness:', err);
			return null;
		}
	};

	const handleIinBlur = async (e, setFieldError) => {
		const val = e.target.value;
		if (!val) return;
		const exists = await checkUnique('iin', val);
		if (exists) setFieldError('iin', 'Пациент с таким ИИН уже существует');
	};

	const handlePhoneBlur = async (e, setFieldError) => {
		const val = e.target.value;
		if (!val) return;
		const exists = await checkUnique('phone', val);
		if (exists) setFieldError('number', 'Пациент с таким телефоном уже существует');
	};

	return (
		<>
			<Modal
				open={open}
				onClose={handleClose}
				aria-labelledby="child-modal-title"
				aria-describedby="child-modal-description"
			>
				<Box sx={{ ...style, width: 300 }}>
					<h2 id="child-modal-title">Вы успешно зарегистрированы!</h2>
					<p id="child-modal-description">Используйте страницу с умом.</p>
					<Button onClick={handleClose}>Закрыть</Button>
				</Box>
			</Modal>

			<Modal
				open={true}
				onClose={onClose}
				aria-labelledby="child-modal-title"
				aria-describedby="child-modal-description"
			>
				<Box sx={{ ...style, width: 400 }}>
					<h2 id="parent-modal-title">Регистрация</h2>
					{error && <p style={{ color: 'red' }}>{typeof error === 'string' ? error : JSON.stringify(error)}</p>}
					<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
						<Form className="reg-form">
							<div className="reg-form-inps">
								<Field
									name="name"
									render={({ field, meta }) => (
										<TextField
											{...field}
											id="outlined-basic"
											label="Логин"
											variant="outlined"
											className="reg-form-inp"
											error={meta.touched && Boolean(meta.error)}
											helperText={meta.touched ? meta.error : ''}
										/>
									)}
								/>
							</div>

							<div className="reg-form-inps">
								<Field name="first_name">
									{({ field, meta }) => (
										<TextField {...field} label="Имя" variant="outlined" className="reg-form-inp" error={meta.touched && Boolean(meta.error)} helperText={meta.touched ? meta.error : ''} />
									)}
								</Field>
							</div>

							<div className="reg-form-inps">
								<Field name="last_name">
									{({ field, meta }) => (
										<TextField {...field} label="Фамилия" variant="outlined" className="reg-form-inp" error={meta.touched && Boolean(meta.error)} helperText={meta.touched ? meta.error : ''} />
									)}
								</Field>
							</div>

							<div className="reg-form-inps">
								<Field name="birth_date">
									{({ field, meta }) => (
										<TextField {...field} label="Дата рождения" type="date" InputLabelProps={{ shrink: true }} variant="outlined" className="reg-form-inp" error={meta.touched && Boolean(meta.error)} helperText={meta.touched ? meta.error : ''} />
									)}
								</Field>
							</div>

							<div className="reg-form-inps">
								<Field name="gender">
									{({ field }) => (
										<TextField select {...field} label="Пол" variant="outlined" className="reg-form-inp">
											<MenuItem value="M">Мужской</MenuItem>
											<MenuItem value="F">Женский</MenuItem>
										</TextField>
									)}
								</Field>
							</div>

							<div className="reg-form-inps">
								<Field name="iin">
									{({ field, meta, form }) => (
										<TextField {...field} label="ИИН" variant="outlined" className="reg-form-inp" error={meta.touched && Boolean(meta.error)} helperText={meta.touched ? meta.error : ''} onBlur={(e) => handleIinBlur(e, form.setFieldError)} />
									)}
								</Field>
							</div>

							<div className="reg-form-inps">
								<Field
									name="email"
									render={({ field, meta }) => (
										<TextField
											{...field}
											id="outlined-basic2"
											label="Почта"
											variant="outlined"
											className="reg-form-inp"
											error={meta.touched && Boolean(meta.error)}
											helperText={meta.touched ? meta.error : ''}
										/>
									)}
								/>
							</div>

							<div className="reg-form-inps">
								<Field
									name="number"
									render={({ field, meta, form }) => (
										<TextField
											{...field}
											type="number"
											id="outlined-basic5"
											label="Номер телефона"
											variant="outlined"
											className="reg-form-inp"
											error={meta.touched && Boolean(meta.error)}
											helperText={meta.touched ? meta.error : ''}
											onBlur={(e) => handlePhoneBlur(e, form.setFieldError)}
											InputProps={{
												startAdornment: (
													<InputAdornment className="startNumberInput" position="start">
														<img className="startNumberInputImg" src={KZimg} alt="" />
														+
													</InputAdornment>
												),
											}}
										/>
									)}
								/>
							</div>

							<div className="reg-form-inps">
								<Field
									name="password"
									render={({ field, meta }) => (
										<TextField
											{...field}
											id="outlined-basic3"
											label="Пароль"
											variant="outlined"
											type={showPassword ? 'text' : 'password'}
											className="reg-form-inp"
											error={meta.touched && Boolean(meta.error)}
											helperText={meta.touched ? meta.error : ''}
											InputProps={{
												endAdornment: (
													<InputAdornment position="end">
														<IconButton
															aria-label="toggle password visibility"
															onClick={() => setShowPassword(!showPassword)}
															edge="end"
														>
															{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
														</IconButton>
													</InputAdornment>
												),
											}}
										/>
									)}
								/>
							</div>

							<Button type="submit" variant="contained" id="extForRegistr">
								Зарегистрироваться
							</Button>
						</Form>
					</Formik>
				</Box>
			</Modal>
		</>
	);
}

export default Registr;
