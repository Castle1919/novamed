import React, { useEffect, useState } from 'react';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import axios from '../api/axios';

export default function MainPatientMainDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');

  const ColorButton = styled(Button)(({ theme }) => ({
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    '&:hover': {
      backgroundColor: blue[700],
    },
  }));

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem('access');
        if (!token) {
          setError('Вы не авторизованы');
          return;
        }

        const response = await axios.get('/doctors/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Doctors data:', response.data);
        setDoctors(response.data.results || []);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Ошибка при загрузке данных о врачах');
      }
    };

    fetchDoctors();
  }, []);

  return (
    <div className="div-for-calendar-and-patients">
      <div className="patients-history">
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {doctors.length === 0 && !error ? (
          <p>Нет врачей для отображения</p>
        ) : (
          doctors.map((doc) => (
            <div className="patients-history-box" key={doc.id}>
              <Avatar
                src={doc.avatar || ''}
                alt="Doctor"
                className="patients-history-box-img"
                sx={{ width: 64, height: 64 }}
              />
              <h3>
                {doc.first_name} {doc.last_name}
              </h3>
              <p className="patients-history-box-p">
                Специальность: {doc.specialty ?? 'Не указана'}
              </p>
              <ColorButton variant="contained">Записаться</ColorButton>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
