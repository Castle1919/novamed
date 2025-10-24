import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Box, Typography, CircularProgress, Alert, Paper, Grid, Divider,
    Accordion, AccordionSummary, AccordionDetails, Chip, List, ListItem, ListItemText,
    Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import axios from '../api/axios';
import dayjs from 'dayjs';

export default function PatientMedicalCard() {
    const { patientId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [patientData, setPatientData] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('access');
                const response = await axios.get(`/patients/${patientId}/history/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPatientData(response.data);
            } catch (err) {
                console.error("Error fetching medical history:", err);
                setError("Не удалось загрузить медицинскую карту пациента.");
            } finally {
                setLoading(false);
            }
        };
        if (patientId) {
            fetchHistory();
        }
    }, [patientId]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!patientData) {
        return <Alert severity="info">Нет данных о пациенте.</Alert>;
    }

    const { patient, history } = patientData;

    return (
        <Box sx={{ p: 3 }}>
            <Button
                component={Link}
                to="/doctor/main/history"
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 2 }}
            >
                К списку пациентов
            </Button>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon fontSize="large" color="primary" />
                    Электронная медицинская карта
                </Typography>
                <Typography variant="h5" color="text.secondary">{patient.name}</Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2"><strong>Дата рождения:</strong> {dayjs(patient.birth_date).format('DD.MM.YYYY')}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2"><strong>Пол:</strong> {patient.gender}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2"><strong>ИИН:</strong> {patient.iin}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2"><strong>Телефон:</strong> {patient.phone}</Typography>
                    </Grid>
                    {patient.allergies && (
                        <Grid item xs={12}>
                            <Alert severity="warning" variant="outlined">
                                <strong>Аллергии:</strong> {patient.allergies}
                            </Alert>
                        </Grid>
                    )}
                    {patient.chronic_diseases && (
                        <Grid item xs={12}>
                            <Alert severity="info" variant="outlined">
                                <strong>Хронические заболевания:</strong> {patient.chronic_diseases}
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            <Typography variant="h5" sx={{ mb: 2 }}>История приемов</Typography>
            {history.length === 0 ? (
                <Typography>У пациента еще не было завершенных приемов.</Typography>
            ) : (
                history.map((record) => (
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
        </Box>
    );
}