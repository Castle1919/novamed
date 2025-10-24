import React, { useState, useEffect } from 'react';
import {
    Modal, Box, Typography, CircularProgress, Alert, Paper, Grid, Divider,
    Accordion, AccordionSummary, AccordionDetails, Chip, List, ListItem, ListItemText,
    IconButton, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import axios from '../api/axios';
import dayjs from 'dayjs';

const style = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%', maxWidth: 900,
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    boxShadow: 24, borderRadius: 2,
    p: 0,
    display: 'flex', flexDirection: 'column',
};

export default function PatientMedicalCardModal({ open, onClose, patientId }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [patientData, setPatientData] = useState(null);

    useEffect(() => {
        if (open && patientId) {
            const fetchHistory = async () => {
                try {
                    setLoading(true);
                    setError('');
                    const token = localStorage.getItem('access');
                    const response = await axios.get(`/patients/${patientId}/history/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setPatientData(response.data);
                } catch (err) {
                    console.error("Error fetching medical history:", err);
                    setError("Не удалось загрузить медицинскую карту.");
                } finally {
                    setLoading(false);
                }
            };
            fetchHistory();
        }
    }, [open, patientId]);

    const renderDetail = (label, value) => (
        <Grid item xs={12} sm={6} md={4}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body1">{value || 'не указано'}</Typography>
        </Grid>
    );

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                {/* Шапка модального окна */}
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" />
                        Электронная медицинская карта
                    </Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>

                {/* Контент с прокруткой */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                    ) : error ? (
                        <Alert severity="error">{error}</Alert>
                    ) : !patientData ? (
                        <Alert severity="info">Нет данных для отображения.</Alert>
                    ) : (
                        <>
                            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f9f9f9' }}>
                                <Typography variant="h5" color="text.secondary" gutterBottom>
                                    {patientData.patient.name}
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={2}>
                                    {renderDetail('Имя', patientData.patient.first_name)}
                                    {renderDetail('Фамилия', patientData.patient.last_name)}
                                    {renderDetail('Дата рождения', dayjs(patientData.patient.birth_date).format('DD.MM.YYYY'))}
                                    {renderDetail('Пол', patientData.patient.gender)}
                                    {renderDetail('ИИН', patientData.patient.iin)}
                                    {renderDetail('Телефон', patientData.patient.phone)}
                                    {renderDetail('Рост (см)', patientData.patient.height)}
                                    {renderDetail('Вес (кг)', patientData.patient.weight)}
                                    {renderDetail('Группа крови', patientData.patient.blood_type)}
                                    {renderDetail('Номер страховки', patientData.patient.insurance_number)}
                                    {renderDetail('Экстренный контакт', patientData.patient.emergency_contact)}
                                </Grid>
                                {patientData.patient.allergies && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        <strong>Аллергии:</strong> {patientData.patient.allergies}
                                    </Alert>
                                )}
                                {patientData.patient.chronic_diseases && (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        <strong>Хронические заболевания:</strong> {patientData.patient.chronic_diseases}
                                    </Alert>
                                )}
                            </Paper>

                            {/* Блок 2: Медицинские особенности (аллергии и хрон. заболевания) */}
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Медицинские особенности</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2">Аллергии:</Typography>
                                        <Typography variant="body2" sx={{ pl: 1, borderLeft: '3px solid #ff9800' }}>
                                            {patientData.patient.allergies || 'Не указано'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ mt: 1 }}>Хронические заболевания:</Typography>
                                        <Typography variant="body2" sx={{ pl: 1, borderLeft: '3px solid #2196f3' }}>
                                            {patientData.patient.chronic_diseases || 'Не указано'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Typography variant="h5" sx={{ mb: 2 }}>История приемов</Typography>
                            {patientData.history.length === 0 ? (
                                <Typography>У пациента еще не было завершенных приемов.</Typography>
                            ) : (
                                patientData.history.map((record) => (
                                    <Accordion key={record.appointment_id}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <Typography sx={{ mr: 2 }}>
                                                    <strong>{dayjs(record.date).format('DD MMMM YYYY')}</strong> - {record.doctor}
                                                </Typography>
                                                <Chip label={record.diagnosis} color="primary" size="small" />
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ bgcolor: '#fafafa' }}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2" gutterBottom>Жалобы пациента</Typography>
                                                    <Typography variant="body2" sx={{ pl: 2, borderLeft: '3px solid #1976d2' }}>{record.complaints || 'Не указано'}</Typography>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2" gutterBottom>Рекомендации</Typography>
                                                    <Typography variant="body2" sx={{ pl: 2, borderLeft: '3px solid #1976d2' }}>{record.recommendations || 'Не указано'}</Typography>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        <LocalHospitalIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                                        Назначенные препараты
                                                    </Typography>
                                                    {record.prescriptions.length > 0 ? (
                                                        <List dense>
                                                            {record.prescriptions.map(p => (
                                                                <ListItem key={p.id} sx={{ py: 0 }}>
                                                                    <ListItemText
                                                                        primary={p.medicine}
                                                                        secondary={`Дозировка: ${p.dosage}, Частота: ${p.frequency}, Длительность: ${p.duration}`}
                                                                    />
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">Препараты не назначены.</Typography>
                                                    )}
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        <DescriptionIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                                        Прикрепленные файлы
                                                    </Typography>
                                                    {record.files.length > 0 ? (
                                                        record.files.map(f => (
                                                            <Button key={f.id} href={f.url} target="_blank" rel="noreferrer" startIcon={<DescriptionIcon />}>
                                                                {f.title}
                                                            </Button>
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">Файлы не прикреплены.</Typography>
                                                    )}
                                                </Grid>
                                            </Grid>
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </Modal>
    );
}