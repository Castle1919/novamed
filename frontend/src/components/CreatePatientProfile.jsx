import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import axios from '../api/axios';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 420,
  bgcolor: 'background.paper',
  boxShadow: 24,
  textAlign: 'center',
  borderRadius: 2,
  p: 3,
};

export default function CreatePatientProfile({ open, onClose, onCreated, disableClose=false }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'M',
    iin: '',
    phone: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const checkUnique = async (field, value) => {
    if (!value) return null;
    try {
      const params = {};
      params[field] = value;
      const resp = await axios.get('/patients/check_unique/', { params });
      return resp.data.exists;
    } catch (err) {
      console.error('Error checking uniqueness:', err);
      return null;
    }
  };

  const handleIinBlur = async () => {
    const iinNorm = form.iin.replace(/\D/g, '');
    if (iinNorm.length !== 12) {
      setError('ИИН должен содержать 12 цифр');
      return;
    }
    const exists = await checkUnique('iin', iinNorm);
    if (exists) setError('Пациент с таким ИИН уже существует');
    else setError('');
  };

  const handlePhoneBlur = async () => {
    const phoneNorm = form.phone ? form.phone.replace(/\D/g, '') : '';
    if (!phoneNorm) return;
    const exists = await checkUnique('phone', form.phone);
    if (exists) setError('Пациент с таким телефоном уже существует');
    else setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // basic client-side validation
    if (!form.first_name || !form.last_name || !form.birth_date || !form.iin) {
      setError('Заполните все обязательные поля');
      return;
    }

    // IIN format check (12 digits)
    const iinNorm = form.iin.replace(/\D/g, '');
    if (iinNorm.length !== 12) {
      setError('ИИН должен содержать 12 цифр');
      return;
    }

    // phone normalization and basic check
    const phoneNorm = form.phone ? form.phone.replace(/\D/g, '') : '';
    if (form.phone && phoneNorm.length < 9) {
      setError('Неверный формат телефона');
      return;
    }

    try {
  const resp = await axios.post('/patients/', form);
      if (onCreated) onCreated(resp.data);
      onClose();
    } catch (err) {
      console.error('Create patient error:', err);
      const msg = err.response?.data || err.message || 'Ошибка';
      setError(JSON.stringify(msg));
    }
  };

  const handleModalClose = (e, reason) => {
    if (disableClose) return; // prevent closing when disabled
    if (onClose) onClose();
  };

  return (
    <Modal open={open} onClose={handleModalClose} aria-labelledby="create-patient-title">
      <Box sx={style} component="form" onSubmit={handleSubmit}>
        <h2 id="create-patient-title">Создать профиль пациента</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <TextField name="first_name" label="Имя" value={form.first_name} onChange={handleChange} fullWidth margin="normal" required />
        <TextField name="last_name" label="Фамилия" value={form.last_name} onChange={handleChange} fullWidth margin="normal" required />
        <TextField name="birth_date" label="Дата рождения" type="date" value={form.birth_date} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
        <TextField select name="gender" label="Пол" value={form.gender} onChange={handleChange} fullWidth margin="normal">
          <MenuItem value="M">Мужской</MenuItem>
          <MenuItem value="F">Женский</MenuItem>
        </TextField>
  <TextField name="iin" label="ИИН" value={form.iin} onChange={handleChange} onBlur={handleIinBlur} fullWidth margin="normal" required />
  <TextField name="phone" label="Телефон" value={form.phone} onChange={handleChange} onBlur={handlePhoneBlur} fullWidth margin="normal" />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
          {!disableClose && <Button variant="outlined" onClick={onClose}>Отмена</Button>}
          <Button type="submit" variant="contained">Создать</Button>
        </Box>
      </Box>
    </Modal>
  );
}
