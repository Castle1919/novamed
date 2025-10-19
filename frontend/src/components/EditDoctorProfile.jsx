import React, { useEffect, useState, forwardRef } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
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
};

const DoctorSchema = Yup.object().shape({
    first_name: Yup.string().required('Имя обязательно'),
    last_name: Yup.string().required('Фамилия обязательна'),
    birth_date: Yup.string().required('Дата рождения обязательна'),
    specialty: Yup.string().required('Специальность обязательна'),
    work_phone: Yup.string().test('len', 'Некорректный телефон', val => {
        if (!val) return true;
        const digits = val.replace(/\D/g, '');
        return digits.length >= 10;
    }),
    iin: Yup.string().test('iin-format', 'ИИН должен содержать 12 цифр', v => !v || /^\d{12}$/.test(v)),
});

const InputElement = forwardRef((props, ref) => {
    return <input type="text" ref={ref} {...props} />;
});

export default function EditDoctorProfile({ open, onClose, onSaved, disableClose = false }) {
    const [initial, setInitial] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const acc = await axios.get('/accounts/profile/');
                if (mounted && acc.data?.avatar) setAvatarUrl(acc.data.avatar);
            } catch {
                /* ignore */
            }

            try {
                const resp = await axios.get('/doctors/me/');
                if (!mounted) return;
                setInitial({
                    first_name: resp.data.first_name || '',
                    last_name: resp.data.last_name || '',
                    birth_date: resp.data.birth_date || '',
                    specialty: resp.data.specialty || '',
                    experience_years: resp.data.experience_years || '',
                    work_phone: resp.data.work_phone || '',
                    iin: resp.data.iin || '',
                });
            } catch {
                if (!mounted) return;
                setInitial({
                    first_name: '',
                    last_name: '',
                    birth_date: '',
                    specialty: '',
                    experience_years: '',
                    work_phone: '',
                    iin: '',
                });
            }
        };
        if (open) load();
        return () => {
            mounted = false;
        };
    }, [open]);

    if (!open) return null;

    return (
        <Modal open={open} onClose={() => { if (!disableClose && onClose) onClose(); }} aria-labelledby="edit-doctor-title">
            <Box sx={MODAL_STYLE}>
                <h2 id="edit-doctor-title">Редактировать профиль доктора</h2>

                {avatarUrl && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                        <Avatar src={avatarUrl} sx={{ width: 80, height: 80 }} />
                    </div>
                )}

                {!initial ? (
                    <p>Загрузка...</p>
                ) : (
                    <Formik
                        initialValues={initial}
                        validationSchema={DoctorSchema}
                        enableReinitialize
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            setSubmitting(true);
                            try {
                                const resp = await axios.put('/doctors/me/', values);
                                if (onSaved) onSaved(resp.data);
                                if (!disableClose && onClose) onClose();
                            } catch (err) {
                                const data = err.response?.data;
                                if (data && typeof data === 'object') {
                                    const fieldErrors = {};
                                    for (const k in data)
                                        fieldErrors[k] = Array.isArray(data[k]) ? data[k].join(' ') : data[k];
                                    setErrors(fieldErrors);
                                } else if (data) {
                                    setErrors({ non_field_errors: data });
                                } else {
                                    setErrors({ non_field_errors: err.message || 'Ошибка при сохранении' });
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
                                    <div style={{ color: 'red', marginBottom: 8 }}>{errors.non_field_errors}</div>
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
                                    label="Стаж (лет)"
                                    type="number"
                                    value={values.experience_years}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
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
                                            label="Рабочий телефон"
                                            fullWidth
                                            margin="normal"
                                            error={Boolean(touched.work_phone && errors.work_phone)}
                                            helperText={touched.work_phone && errors.work_phone}
                                        />
                                    )}
                                </InputMask>

                                <TextField
                                    name="iin"
                                    label="ИИН"
                                    value={values.iin}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    margin="normal"
                                    error={Boolean(touched.iin && errors.iin)}
                                    helperText={touched.iin && errors.iin}
                                />

                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                                    {!disableClose && (
                                        <Button variant="outlined" onClick={onClose}>
                                            Отмена
                                        </Button>
                                    )}
                                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                                        {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Formik>
                )}
            </Box>
        </Modal>
    );
}
