import React, { useEffect, useState } from 'react';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PhoneIcon from '@mui/icons-material/Phone';
import axios from '../api/axios';
import AppointmentBookingModal from '../components/AppointmentBookingModal';
import { Box, Typography } from '@mui/material';
import { Card, CardContent } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ColorButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(blue[500]),
  backgroundColor: blue[500],
  '&:hover': {
    backgroundColor: blue[700],
  },
}));

export default function MainPatientMainDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
        // Проверяем разные варианты структуры ответа
        const doctorsList = response.data.results || response.data || [];
        setDoctors(doctorsList);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Ошибка при загрузке данных о врачах');
      }
    };

    fetchDoctors();
  }, []);

  const handleBookAppointment = (doctor) => {
    // Формируем объект врача для модального окна
    const doctorData = {
      id: doctor.id,
      name: `${doctor.last_name || ''} ${doctor.first_name || ''} ${doctor.middle_name || ''}`.trim(),
      specialization: doctor.specialty || doctor.specialization || 'Не указана',
      office_number: doctor.office_number || doctor.office || '',
      phone: doctor.phone || '',
      avatar: doctor.avatar || '',
    };

    setSelectedDoctor(doctorData);
    setBookingModalOpen(true);
  };

  const handleBookingClose = (wasSuccessful) => {
    setBookingModalOpen(false);

    if (wasSuccessful) {
      // Показываем сообщение об успешной записи
      setSuccessMessage('Вы успешно записались на приём!');

      // Убираем сообщение через 5 секунд
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }

    setSelectedDoctor(null);
  };

  return (
    <div className="div-for-calendar-and-patients">
      <div className="patients-history">
        {successMessage && (
          <Box sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            animation: 'slideIn 0.3s ease-out',
          }}>
            <Card sx={{
              bgcolor: '#4caf50',
              color: 'white',
              minWidth: 300,
              boxShadow: 4,
              borderRadius: 2,
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 30 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Успешно!
                  </Typography>
                  <Typography variant="body2">
                    {successMessage}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}



        {/* Сообщение об ошибке */}
        {error && (
          <div style={{
            backgroundColor: '#f44336',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Список врачей */}
        {doctors.length === 0 && !error ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666',
          }}>
            <LocalHospitalIcon style={{ fontSize: 60, color: '#ccc', marginBottom: '10px' }} />
            <p>Нет врачей для отображения</p>
          </div>
        ) : (
          doctors.map((doc) => (
            <div className="patients-history-box" key={doc.id} style={{
              position: 'relative',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }
            }}>
              {/* Аватар врача */}
              <Avatar
                src={doc.avatar || ''}
                alt={`${doc.first_name} ${doc.last_name}`}
                className="patients-history-box-img"
                sx={{
                  width: 80,
                  height: 80,
                  margin: '0 auto 15px',
                  bgcolor: blue[500],
                  fontSize: '24px',
                }}
              >
                {!doc.avatar && (doc.first_name?.[0] || 'Д')}
              </Avatar>

              {/* Имя врача */}
              <h3 style={{
                textAlign: 'center',
                marginBottom: '10px',
                color: '#333',
              }}>
                {doc.last_name || ''} {doc.first_name || ''}
                {doc.middle_name && (
                  <span style={{ display: 'block', fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    {doc.middle_name}
                  </span>
                )}
              </h3>

              {/* Специальность */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <Chip
                  icon={<LocalHospitalIcon />}
                  label={doc.specialty || doc.specialization || 'Не указана'}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </div>

              {/* Дополнительная информация */}
              <div style={{ marginBottom: '15px' }}>
                {doc.office_number && (
                  <p style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '5px'
                  }}>
                    <MeetingRoomIcon style={{ fontSize: '18px', marginRight: '5px' }} />
                    Кабинет: {doc.office_number}
                  </p>
                )}

                {doc.phone && (
                  <p style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '5px'
                  }}>
                    <PhoneIcon style={{ fontSize: '18px', marginRight: '5px' }} />
                    {doc.phone}
                  </p>
                )}

                {doc.experience && (
                  <p style={{
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '5px'
                  }}>
                    Стаж: {doc.experience} лет
                  </p>
                )}
              </div>

              {/* Кнопка записи */}
              <ColorButton
                variant="contained"
                fullWidth
                onClick={() => handleBookAppointment(doc)}
                sx={{
                  py: 1.5,
                  fontSize: '16px',
                  fontWeight: 500,
                }}
              >
                Записаться на приём
              </ColorButton>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно для записи */}
      <AppointmentBookingModal
        open={bookingModalOpen}
        onClose={handleBookingClose}
        doctor={selectedDoctor}
      />

      {/* CSS анимация для сообщения об успехе */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .patients-history-box:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
      <style>{`
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`}</style>
    </div>
  );
}