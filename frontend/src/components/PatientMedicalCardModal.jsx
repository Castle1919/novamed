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
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

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
                    {t("patient-medical-card-modal.title")}
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
                    <Alert severity="info">{t("patient-medical-card-modal.no_data")}</Alert>
                ) : (
                    <>
                        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f9f9f9' }}>
                            <Typography variant="h5" color="text.secondary" gutterBottom>
                                {patientData.patient.name}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={2}>
                                {renderDetail(t("patient-medical-card-modal.name"), patientData.patient.first_name)}
                                {renderDetail(t("patient-medical-card-modal.last_name"), patientData.patient.last_name)}
                                {renderDetail(t("patient-medical-card-modal.burth_date"), dayjs(patientData.patient.birth_date).format('DD.MM.YYYY'))}
                                {renderDetail(t("patient-medical-card-modal.sex"), patientData.patient.gender)}
                                {renderDetail(t("patient-medical-card-modal.iin"), patientData.patient.iin)}
                                {renderDetail(t("patient-medical-card-modal.phone_number"), patientData.patient.phone)}
                                {renderDetail(t("patient-medical-card-modal.growth"), patientData.patient.height)}
                                {renderDetail(t("patient-medical-card-modal.weight"), patientData.patient.weight)}
                                {renderDetail(t("patient-medical-card-modal.blood_type"), patientData.patient.blood_type)}
                                {renderDetail(t("patient-medical-card-modal.ensurance_policy"), patientData.patient.insurance_number)}
                                {renderDetail(t("patient-medical-card-modal.extra_contacts"), patientData.patient.emergency_contact)}
                            </Grid>
                        </Paper>
                        {/* Блок 2: Медицинские особенности */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>{t("patient-medical-card-modal.med_osb")}</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">{t("patient-medical-card-modal.allergies")}</Typography>
                                    <Typography variant="body2" sx={{ pl: 1, borderLeft: '3px solid #ff9800' }}>
                                        {patientData.patient.allergies || t("patient-medical-card-modal.no_data")}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ mt: 1 }}>{t("patient-medical-card-modal.chronic_diseases")}</Typography>
                                    <Typography variant="body2" sx={{ pl: 1, borderLeft: '3px solid #2196f3' }}>
                                        {patientData.patient.chronic_diseases || t("patient-medical-card-modal.no_data")}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                        {/* История приемов */}
                        <Typography variant="h5" sx={{ mb: 2 }}>{t("patient-medical-card-modal.reception_history")}</Typography>
                        {patientData.history.length === 0 ? (
                            <Typography>{t("patient-medical-card-modal.no_receptions")}</Typography>
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
                                                <Typography variant="subtitle2" gutterBottom>{t("patient-medical-card-modal.complaints")}</Typography>
                                                <Typography variant="body2" sx={{ pl: 2, borderLeft: '3px solid #1976d2' }}>{record.complaints || t("patient-medical-card-modal.no_data")}</Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="subtitle2" gutterBottom>{t("patient-medical-card-modal.recommendations")}</Typography>
                                                <Typography variant="body2" sx={{ pl: 2, borderLeft: '3px solid #1976d2' }}>{record.recommendations || t("patient-medical-card-modal.no_data")}</Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Divider sx={{ my: 1 }} />
                                                <Typography variant="subtitle2" gutterBottom>
                                                    <LocalHospitalIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                                    {t("patient-medical-card-modal.prescribed_medications")}
                                                </Typography>
                                                {record.prescriptions.length > 0 ? (
                                                    <List dense>
                                                        {record.prescriptions.map(p => (
                                                            <ListItem key={p.id} sx={{ py: 0 }}>
                                                                <ListItemText
                                                                    primary={p.medicine}
                                                                    secondary={`${t("patient-medical-card-modal.dosage")}: ${p.dosage}, ${t("patient-medical-card-modal.frequency")}: ${p.frequency}, ${t("patient-medical-card-modal.duration")}: ${p.duration}`}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">{t("patient-medical-card-modal.no_medications")}</Typography>
                                                )}
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Divider sx={{ my: 1 }} />
                                                <Typography variant="subtitle2" gutterBottom>
                                                    <DescriptionIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                                    {t("patient-medical-card-modal.attached_files")}
                                                </Typography>
                                                {record.files.length > 0 ? (
                                                    record.files.map(f => (
                                                        <Button key={f.id} href={f.url} target="_blank" rel="noreferrer" startIcon={<DescriptionIcon />}>
                                                            {f.title}
                                                        </Button>
                                                    ))
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">{t("patient-medical-card-modal.no_files")}</Typography>
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