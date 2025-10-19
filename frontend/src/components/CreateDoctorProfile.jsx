import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
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

export default function CreateDoctorProfile({ open, onClose, onCreated, disableClose=false }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    specialty: '',
    experience_years: '',
    work_phone: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.first_name || !form.last_name || !form.birth_date || !form.specialty) {
      setError('Заполните все обязательные поля');
      return;
    }
    try {
      const resp = await axios.post('/doctors/', form);
      if (onCreated) onCreated(resp.data);
      if (!disableClose && onClose) onClose();
    } catch (err) {
      console.error('Create doctor error:', err);
      setError(err.response?.data || err.message || 'Ошибка');
    }
  };

  const handleModalClose = () => {
    if (disableClose) return;
    if (onClose) onClose();
  };

  return (
    <Modal open={open} onClose={handleModalClose} aria-labelledby="create-doctor-title">
      <Box sx={style} component="form" onSubmit={handleSubmit}>
        <h2 id="create-doctor-title">Создать профиль доктора</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <TextField name="first_name" label="Имя" value={form.first_name} onChange={handleChange} fullWidth margin="normal" required />
        <TextField name="last_name" label="Фамилия" value={form.last_name} onChange={handleChange} fullWidth margin="normal" required />
        <TextField name="birth_date" label="Дата рождения" type="date" value={form.birth_date} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
        <TextField name="specialty" label="Специальность" value={form.specialty} onChange={handleChange} fullWidth margin="normal" required />
        <TextField name="experience_years" label="Стаж (лет)" type="number" value={form.experience_years} onChange={handleChange} fullWidth margin="normal" />
        <TextField name="work_phone" label="Рабочий телефон" value={form.work_phone} onChange={handleChange} fullWidth margin="normal" />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
          {!disableClose && <Button variant="outlined" onClick={onClose}>Отмена</Button>}
          <Button type="submit" variant="contained">Создать</Button>
        </Box>
      </Box>
    </Modal>
  );
}
