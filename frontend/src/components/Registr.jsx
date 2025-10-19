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
import MenuItem from '@mui/material/MenuItem';
import * as yup from 'yup';
import KZimg from '../assets/kz.png';

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

const professions = [
	{ value: 'Hirurg', label: 'Хирург' },
	{ value: 'Terapeft', label: 'Терапевт' },
	{ value: 'Okulist', label: 'Окулист' },
	{ value: 'Dermatolog', label: 'Дерматолог' },
	{ value: 'Kardiolog', label: 'Кардиолог' },
];

function Registr({ onClose }) {
	const [open, setOpen] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const handleOpen = () => setOpen(true);

	const handleClose = () => {
		setOpen(false);
		onClose();
	};

	const validationSchema = yup.object().shape({
		name: yup.string().required('Обязательное поле'),
		email: yup.string().email('Неверный формат email').required('Обязательное поле'),
		profession: yup.string().required('Обязательное поле'),
		number: yup
			.string()
			.min(11, 'Минимальная длина - 11 символов')
			.max(11, 'Максимальная длина - 11 символов')
			.required('Обязательное поле'),
		password: yup
			.string()
			.min(8, 'Минимальная длина пароля - 8 символов')
			.required('Обязательное поле'),
	});

	const initialValues = {
		name: '',
		email: '',
		profession: '',
		number: '',
		password: '',
	};

	const onSubmit = (values, { setSubmitting }) => {
		handleOpen();
		console.log(values);
		setSubmitting(false);
	};

	return (
		<>
			{/* Модалка успешной регистрации */}
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

			{/* Основная модалка регистрации */}
			<Modal
				open={true}
				onClose={onClose}
				aria-labelledby="parent-modal-title"
				aria-describedby="parent-modal-description"
			>
				<Box sx={{ ...style, width: 400 }}>
					<h2 id="parent-modal-title">Регистрация</h2>
					<Formik
						initialValues={initialValues}
						validationSchema={validationSchema}
						onSubmit={onSubmit}
					>
						<Form className="reg-form">
							{/* Имя */}
							<div className="reg-form-inps">
								<Field name="name">
									{({ field, meta }) => (
										<TextField
											{...field}
											label="Имя"
											variant="outlined"
											className="reg-form-inp"
											error={meta.touched && Boolean(meta.error)}
											helperText={meta.touched ? meta.error : ''}
										/>
									)}
								</Field>
							</div>

							{/* Почта */}
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
										/>
									)}
								</Field>
							</div>

							{/* Профессия */}
							<div className="reg-form-inps">
								<Field name="profession">
									{({ field, meta }) => (
										<TextField
											{...field}
											select
											label="Профессия"
											className="reg-form-inp"
											error={meta.touched && Boolean(meta.error)}
											helperText={meta.touched ? meta.error : ''}
											defaultValue="Terapeft"
										>
											{professions.map((option) => (
												<MenuItem key={option.value} value={option.value}>
													{option.label}
												</MenuItem>
											))}
										</TextField>
									)}
								</Field>
							</div>

							{/* Номер телефона */}
							<div className="reg-form-inps">
								<Field name="number">
									{({ field, meta }) => (
										<TextField
											{...field}
											type="number"
											label="Номер телефона"
											variant="outlined"
											className="reg-form-inp"
											error={meta.touched && Boolean(meta.error)}
											helperText={meta.touched ? meta.error : ''}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<img className="startNumberInputImg" src={KZimg} alt="" />
														+
													</InputAdornment>
												),
											}}
										/>
									)}
								</Field>
							</div>

							{/* Пароль */}
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
								</Field>
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
