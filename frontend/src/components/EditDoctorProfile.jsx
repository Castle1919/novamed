import React, { useEffect, useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import axios from '../api/axios';
import InputMask from 'react-input-mask';
import { Formik } from 'formik';
import * as Yup from 'yup';

const MODAL_STYLE = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 520,
    bgcolor: 'background.paper',
    boxShadow: 24,
    textAlign: 'center',
    borderRadius: 2,
    p: 3,
    maxHeight: '90vh',
    overflowY: 'auto',
};

const DoctorSchema = Yup.object().shape({
    first_name: Yup.string()
        .trim()
        .min(2, 'Имя должно содержать минимум 2 символа')
        .max(100, 'Имя не может быть длиннее 100 символов')
        .required('Имя обязательно'),
    last_name: Yup.string()
        .trim()
        .min(2, 'Фамилия должна содержать минимум 2 символа')
        .max(100, 'Фамилия не может быть длиннее 100 символов')
        .required('Фамилия обязательна'),
    birth_date: Yup.date()
        .max(new Date(), 'Дата рождения не может быть в будущем')
        .test('age', 'Врач должен быть старше 22 лет', function(value) {
            if (!value) return false;
            const today = new Date();
            const birthDate = new Date(value);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age >= 22;
        })
        .required('Дата рождения обязательна'),
    iin: Yup.string()
        .trim()
        .matches(/^\d{12}$/, 'ИИН должен содержать ровно 12 цифр')
        .required('ИИН обязателен для заполнения'),
    specialty: Yup.string()
        .trim()
        .min(3, 'Специальность должна содержать минимум 3 символа')
        .required('Специальность обязательна'),
    experience_years: Yup.number()
        .min(0, 'Стаж не может быть отрицательным')
        .max(70, 'Стаж не может превышать 70 лет')
        .required('Стаж работы обязателен'),
    work_phone: Yup.string()
        .test('phone-length', 'Телефон должен содержать минимум 10 цифр', val => {
            if (!val) return false;
            const digits = val.replace(/\D/g, '');
            return digits.length >= 10 && digits.length <= 15;
        })
        .required('Рабочий телефон обязателен'),
    license_number: Yup.string().max(50, 'Номер лицензии не может быть длиннее 50 символов'),
    department: Yup.string().max(100, 'Название отделения не может быть длиннее 100 символов'),
    working_hours: Yup.string().max(100, 'Часы работы не могут быть длиннее 100 символов'),
});

export default function EditDoctorProfile({ open, onClose, onSaved, disableClose = false }) {
    const [initial, setInitial] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileExists, setProfileExists] = useState(false);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            if (!open) return;

            try {
                setLoading(true);

                // Загружаем аватар из профиля пользователя
                try {
                    const acc = await axios.get('/accounts/profile/');
                    if (mounted && acc.data?.avatar) {
                        setAvatarUrl(acc.data.avatar);
                    }
                } catch (err) {
                    console.warn('Could not load user avatar:', err);
                }

                // Загружаем профиль доктора
                try {
                    const resp = await axios.get('/doctors/me/');
                    if (!mounted) return;

                    console.log('Doctor profile loaded:', resp.data);
                    setProfileExists(true);
                    setInitial({
                        first_name: resp.data.first_name || '',
                        last_name: resp.data.last_name || '',
                        birth_date: resp.data.birth_date || '',
                        iin: resp.data.iin || '',
                        specialty: resp.data.specialty || '',
                        experience_years: resp.data.experience_years || 0,
                        work_phone: resp.data.work_phone || '',
                        license_number: resp.data.license_number || '',
                        department: resp.data.department || '',
                        working_hours: resp.data.working_hours || '',
                    });
                } catch (err) {
                    if (!mounted) return;

                    // Профиль не найден - создаем пустую форму
                    if (err.response && err.response.status === 404) {
                        console.log('Doctor profile not found, initializing empty form');
                        setProfileExists(false);
                        setInitial({
                            first_name: '',
                            last_name: '',
                            birth_date: '',
                            iin: '',
                            specialty: '',
                            experience_years: 0,
                            work_phone: '',
                            license_number: '',
                            department: '',
                            working_hours: '',
                        });
                    } else {
                        console.error('Error loading doctor profile:', err);
                        setInitial({
                            first_name: '',
                            last_name: '',
                            birth_date: '',
                            iin: '',
                            specialty: '',
                            experience_years: 0,
                            work_phone: '',
                            license_number: '',
                            department: '',
                            working_hours: '',
                        });
                    }
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [open]);

    const handleModalClose = () => {
        if (disableClose) return;
        if (onClose) onClose();
    };

    if (!open) return null;

    return (
        <Modal 
            open={open} 
            onClose={handleModalClose} 
            aria-labelledby="edit-doctor-title"
        >
            <Box sx={MODAL_STYLE}>
                <h2 id="edit-doctor-title">
                    {profileExists ? 'Редактировать профиль доктора' : 'Создать профиль доктора'}
                </h2>

                {avatarUrl && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                        <Avatar src={avatarUrl} sx={{ width: 80, height: 80 }} />
                    </div>
                )}

                {loading || !initial ? (
                    <p>Загрузка...</p>
                ) : (
                    <Formik
                        initialValues={initial}
                        validationSchema={DoctorSchema}
                        enableReinitialize
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            setSubmitting(true);
                            console.log('Submitting doctor profile:', values);

                            try {
                                // Используем PUT для создания или обновления
                                const resp = await axios.put('/doctors/me/', values);
                                console.log('Doctor profile saved:', resp.data);

                                if (onSaved) {
                                    onSaved(resp.data);
                                }

                                if (!disableClose && onClose) {
                                    onClose();
                                }

                                // Если профиль был создан впервые, перезагружаем страницу
                                if (!profileExists) {
                                    window.location.href = '/doctor/main';
                                }
                            } catch (err) {
                                console.error('Error saving doctor profile:', err);

                                const data = err.response?.data;
                                if (data && typeof data === 'object') {
                                    const fieldErrors = {};
                                    for (const k in data) {
                                        fieldErrors[k] = Array.isArray(data[k]) 
                                            ? data[k].join(' ') 
                                            : data[k];
                                    }
                                    setErrors(fieldErrors);
                                } else if (data) {
                                    setErrors({ non_field_errors: data });
                                } else {
                                    setErrors({ 
                                        non_field_errors: err.message || 'Ошибка при сохранении' 
                                    });
                                }
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    >
                        {({
                            values,
                            errors,
                            touched,
                            handleChange,
                            handleBlur,
                            handleSubmit,
                            isSubmitting,
                            setFieldValue,
                        }) => (
                            <Box component="form" onSubmit={handleSubmit}>
                                {errors.non_field_errors && (
                                    <div style={{ 
                                        color: '#d32f2f', 
                                        backgroundColor: '#ffebee',
                                        padding: '10px',
                                        borderRadius: '4px',
                                        marginBottom: 8 
                                    }}>
                                        {errors.non_field_errors}
                                    </div>
                                )}

                                <TextField
                                    name="first_name"
                                    label="Имя"
                                    value={values.first_name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={Boolean(touched.first_name && errors.first_name)}
                                    helperText={touched.first_name && errors.first_name}
                                    required
                                />

                                <TextField
                                    name="last_name"
                                    label="Фамилия"
                                    value={values.last_name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={Boolean(touched.last_name && errors.last_name)}
                                    helperText={touched.last_name && errors.last_name}
                                    required
                                />

                                <TextField
                                    name="birth_date"
                                    label="Дата рождения"
                                    type="date"
                                    value={values.birth_date}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(touched.birth_date && errors.birth_date)}
                                    helperText={touched.birth_date && errors.birth_date}
                                    required
                                />

                                <TextField
                                    name="iin"
                                    label="ИИН (12 цифр)"
                                    value={values.iin}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setFieldValue('iin', value.slice(0, 12));
                                    }}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={Boolean(touched.iin && errors.iin)}
                                    helperText={touched.iin && errors.iin}
                                    placeholder="000000000000"
                                    inputProps={{ maxLength: 12 }}
                                    required
                                />

                                <TextField
                                    name="specialty"
                                    label="Специальность"
                                    value={values.specialty}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={Boolean(touched.specialty && errors.specialty)}
                                    helperText={touched.specialty && errors.specialty}
                                    required
                                />

                                <TextField
                                    name="experience_years"
                                    label="Стаж работы (лет)"
                                    type="number"
                                    value={values.experience_years}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={Boolean(touched.experience_years && errors.experience_years)}
                                    helperText={touched.experience_years && errors.experience_years}
                                    inputProps={{ min: 0, max: 70 }}
                                    required
                                />

                                <InputMask
                                    mask="+7 (999) 999-99-99"
                                    value={values.work_phone}
                                    onChange={(e) => setFieldValue('work_phone', e.target.value)}
                                    onBlur={handleBlur}
                                >
                                    {(inputProps) => (
                                        <TextField
                                            {...inputProps}
                                            name="work_phone"
                                            label="Рабочий телефон *"
                                            fullWidth
                                            margin="normal"
                                            error={Boolean(touched.work_phone && errors.work_phone)}
                                            helperText={touched.work_phone && errors.work_phone}
                                            placeholder="+7 (777) 777-77-77"
                                            required
                                        />
                                    )}
                                </InputMask>

                                <TextField
                                    name="license_number"
                                    label="Номер лицензии"
                                    value={values.license_number}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                />

                                <TextField
                                    name="department"
                                    label="Отделение"
                                    value={values.department}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                />

                                <TextField
                                    name="working_hours"
                                    label="Часы работы"
                                    value={values.working_hours}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    placeholder="Например: Пн-Пт 9:00-18:00"
                                />

                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                                    {!disableClose && (
                                        <Button variant="outlined" onClick={onClose}>
                                            Отмена
                                        </Button>
                                    )}
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        disabled={isSubmitting}
                                        sx={{ minWidth: 120 }}
                                    >
                                        {isSubmitting ? 'Сохранение...' : (profileExists ? 'Сохранить' : 'Создать профиль')}
                                    </Button>
                                </Box>

                                {disableClose && (
                                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Для продолжения работы необходимо заполнить профиль врача
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Formik>
                )}
            </Box>
        </Modal>
    );
}