import React, { useEffect, useState } from 'react';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import {
    Avatar,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Box,
    Typography
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useTranslation } from 'react-i18next'; // Импортируем хук
import axios from '../api/axios';
import AppointmentBookingModal from './AppointmentBookingModal';

const ColorButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(blue[500]),
  backgroundColor: blue[500],
  '&:hover': {
    backgroundColor: blue[700],
  },
}));

const DoctorsPageComponent = () => {
  const { t } = useTranslation(); // Инициализируем функцию перевода
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access');
        if (!token) {
          setError(t('doctorsPage.errors.unauthorized'));
          return;
        }
        
        const response = await axios.get('/doctors/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const doctorsList = response.data.results || response.data || [];
        setDoctors(doctorsList);

      } catch (err) {
        setError(t('doctorsPage.errors.fetchError'));
        console.error('Error fetching doctors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [t]); // Добавляем t в зависимости useEffect

  const handleBookAppointment = (doctor) => {
    const doctorData = {
      id: doctor.id,
      name: `${doctor.last_name || ''} ${doctor.first_name || ''} ${doctor.middle_name || ''}`.trim(),
      specialization: doctor.specialty || doctor.specialization || t('doctorsPage.doctorCard.noSpecialty'),
      office_number: doctor.office_number || doctor.office || '',
    };
    setSelectedDoctor(doctorData);
    setBookingModalOpen(true);
  };
  
  const handleBookingClose = (wasSuccessful) => {
    setBookingModalOpen(false);
    if (wasSuccessful) {
      setSuccessMessage(t('doctorsPage.success.bookingMessage'));
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
    setSelectedDoctor(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <div className="doctors-grid-container">
        {successMessage && (
            <div style={{
                position: 'fixed',
                top: 80,
                right: 20,
                zIndex: 9999,
                animation: 'slideIn 0.3s ease-out',
            }}>
                <Card sx={{ bgcolor: '#4caf50', color: 'white', minWidth: 300, boxShadow: 4, borderRadius: 2 }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CheckCircleIcon sx={{ fontSize: 30 }} />
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">{t('doctorsPage.success.title')}</Typography>
                            <Typography variant="body2">{successMessage}</Typography>
                        </Box>
                    </CardContent>
                </Card>
            </div>
        )}

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
        
        {doctors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <LocalHospitalIcon style={{ fontSize: 60, color: '#ccc', marginBottom: '10px' }} />
                <p>{t('doctorsPage.noDoctorsMessage')}</p>
            </div>
        ) : (
            <div className="doctors-grid">
                {doctors.map((doc) => (
                    <div className="doctor-card-box" key={doc.id}>
                        <Avatar
                            src={doc.avatar || ''}
                            alt={`${doc.first_name} ${doc.last_name}`}
                            sx={{ width: 80, height: 80, bgcolor: blue[500], fontSize: '24px' }}
                        >
                            {!doc.avatar && (doc.first_name?.[0] || t('doctorsPage.doctorCard.doctorInitial'))}
                        </Avatar>

                        <h3>{doc.last_name || ''} {doc.first_name || ''}</h3>

                        <p>
                            {doc.specialty || doc.specialization || t('doctorsPage.doctorCard.noSpecialty')}
                        </p>

                        <ColorButton 
                            variant="contained"
                            fullWidth
                            onClick={() => handleBookAppointment(doc)}
                        >
                            {t('doctorsPage.doctorCard.bookButton')}
                        </ColorButton>
                    </div>
                ))}
            </div>
        )}

        <AppointmentBookingModal
            open={bookingModalOpen}
            onClose={handleBookingClose}
            doctor={selectedDoctor}
        />

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

const MainPatientMainDoctors = React.memo(DoctorsPageComponent);
export default MainPatientMainDoctors;