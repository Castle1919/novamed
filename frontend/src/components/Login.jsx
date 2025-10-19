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
import { Formik, Field, Form, ErrorMessage } from 'formik';
import axios from '../api/axios';
import { setTokens } from '../api';
import * as yup from 'yup';
import { NavLink } from "react-router-dom";
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

function Login({ onClose }) {
    // const dispatch = useDispatch()
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
        onClose()
    };

    const validationSchema = yup.object().shape({
        email: yup.string().email('Неверный формат email').required('Обязательное поле'),
        password: yup.string().min(8, 'Минимальная длина пароля - 8 символов').required('Обязательное поле'),
    });

    const initialValues = {
        email: '',
        password: '',
    };

    const onSubmit = async (values, { setSubmitting }) => {
        setSubmitting(true);
        try {
            // backend expects 'username' for TokenObtainPairSerializer
            const response = await axios.post('/accounts/login/', {
                username: values.email,
                email: values.email,
                password: values.password,
            });

            try {
                const payload = JSON.parse(atob(response.data.access.split('.')[1]));
                setTokens({ access: response.data.access, refresh: response.data.refresh, role: payload.role });
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
            } catch (e) {
                setTokens({ access: response.data.access, refresh: response.data.refresh, role: null });
            }

            handleOpen();
        } catch (err) {
            const msg = err.response?.data || err.message || 'Ошибка входа';
            console.error('Login error:', err.response?.status, err.response?.data, err.message);
            alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }

        setSubmitting(false);
    };

    return (
        <>
            <Modal
                open={open}
                aria-labelledby="child-modal-title"
                aria-describedby="child-modal-description"
            >
                <Box sx={{ ...style, width: 300 }}>
                    <h2 id="child-modal-title">Вы успешно зашли!</h2>
                    <p id="child-modal-description">
                        Используйте страницу с умом.
                    </p>
                    <Button onClick={handleClose}><NavLink to="/doctor/main" className='for-navs2'>Закрыть</NavLink></Button>
                </Box>
            </Modal>

            <Modal
                open={true}
                onClose={onClose}
                aria-labelledby="child-modal-title"
                aria-describedby="child-modal-description"
            >
                <Box sx={{ ...style, width: 400 }}>
                    <h2 id="parent-modal-title">Вход</h2>
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={onSubmit}
                    >
                        <Form className='reg-form'>
                            <div className='reg-form-inps'>
                                <Field
                                    name="email"
                                    render={({ field, meta }) => (
                                        <TextField
                                            {...field}
                                            id="outlined-basic2"
                                            label="Почта"
                                            variant="outlined"
                                            className='reg-form-inp'
                                            error={meta.touched && Boolean(meta.error)}
                                            helperText={meta.touched ? meta.error : ''}
                                        />
                                    )}
                                />
                                {/* <ErrorMessage name="email" component="div" className='reg-form-error' /> */}
                            </div>

                            <div className='reg-form-inps'>
                                <Field
                                    name="password"
                                    render={({ field, meta }) => (
                                        <TextField
                                            {...field}
                                            id="outlined-basic3"
                                            label="Пароль"
                                            variant="outlined"
                                            type={showPassword ? 'text' : 'password'}
                                            className='reg-form-inp'
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
                                {/* <ErrorMessage name="password" component="div" className='reg-form-error' /> */}
                            </div>
                            <Button type='submit' variant="contained" id='extForRegistr'>Войти</Button>
                        </Form>
                    </Formik>
                </Box>
            </Modal>
        </>
    );
}

export default Login;