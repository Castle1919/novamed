import React, { useEffect, useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import axios from '../api/axios';
import { getAccessToken } from '../api';

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

export default function EditPatientProfile({ open, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const resp = await axios.get('/accounts/profile/');
        // Now fetch patient by /patients/me/
        const patient = await axios.get('/patients/me/');
        setForm(patient.data);
      } catch (err) {
        console.error('Error fetching profile for edit:', err);
        setError('Не удалось загрузить профиль');
      }
    };
    if (open) fetchProfile();
  }, [open]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form) return;
    try {
      const resp = await axios.put('/patients/me/', form);
      if (onSaved) onSaved(resp.data);
      onClose();
    } catch (err) {
      console.error('Save profile error:', err);
      setError(err.response?.data || err.message || 'Ошибка при сохранении');
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="edit-patient-title">
      <Box sx={style} component="form" onSubmit={handleSubmit}>
        <h2 id="edit-patient-title">Изменить профиль пациента</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!form ? (
          <p>Загрузка...</p>
        ) : (
          <>
            <TextField name="first_name" label="Имя" value={form.first_name || ''} onChange={handleChange} fullWidth margin="normal" required />
            <TextField name="last_name" label="Фамилия" value={form.last_name || ''} onChange={handleChange} fullWidth margin="normal" required />
            <TextField name="birth_date" label="Дата рождения" type="date" value={form.birth_date || ''} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
            <TextField select name="gender" label="Пол" value={form.gender || 'M'} onChange={handleChange} fullWidth margin="normal">
              <MenuItem value="M">Мужской</MenuItem>
              <MenuItem value="F">Женский</MenuItem>
            </TextField>
            <TextField name="iin" label="ИИН" value={form.iin || ''} onChange={handleChange} fullWidth margin="normal" required />
            <TextField name="phone" label="Телефон" value={form.phone || ''} onChange={handleChange} fullWidth margin="normal" />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button variant="outlined" onClick={onClose}>Отмена</Button>
              <Button type="submit" variant="contained">Сохранить</Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
}
