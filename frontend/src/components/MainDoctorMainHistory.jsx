import React, { useState, useEffect } from 'react';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import {
	Button, Paper, InputBase, IconButton, Box, CircularProgress,
	Alert, Typography, Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import axios from '../api/axios';
import PatientMedicalCardModal from './PatientMedicalCardModal';
import {useTranslation} from "react-i18next";


const ColorButton = styled(Button)(({ theme }) => ({
	color: theme.palette.getContrastText(blue[500]),
	backgroundColor: blue[500],
	'&:hover': {
		backgroundColor: blue[700],
	},
}));

export default function MainDoctorMainHistory() {
	const [patients, setPatients] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [query, setQuery] = useState('');
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedPatientId, setSelectedPatientId] = useState(null);
	const { t } = useTranslation();

	useEffect(() => {
		const fetchPatients = async () => {
			try {
				const token = localStorage.getItem('access');
				const response = await axios.get('/patients/', {
					headers: { Authorization: `Bearer ${token}` }
				});
				setPatients(response.data.results || response.data || []);
			} catch (err) {
				console.error("Error fetching patients:", err);
				setError("Не удалось загрузить список пациентов.");
			} finally {
				setLoading(false);
			}
		};
		fetchPatients();
	}, []);

	const handleOpenCard = (id) => {
		setSelectedPatientId(id);
		setModalOpen(true);
	};

	const filteredPatients = patients.filter(p =>
		`${p.first_name} ${p.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
		(p.iin && p.iin.includes(query))
	);

	if (loading) {
		return (
			<div className="patient-history-main">
				<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 4 }}>
					<CircularProgress />
				</Box>
			</div>
		);
	}

	if (error) {
		return (
			<div className="patient-history-main">
				<Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
			</div>
		);
	}

	return (
		<div className="patient-history-main">
			<div className="patient-history-input">
				<h2>{t('main-doctor-history.title')}</h2>
				<Paper
					component="form"
					sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 300 }}
				>
					<InputBase
						sx={{ ml: 1, flex: 1 }}
						placeholder={t('main-doctor-history.search')}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<IconButton type="button" sx={{ p: '10px' }} aria-label="search">
						<SearchIcon />
					</IconButton>
				</Paper>
			</div>

			{filteredPatients.length === 0 ? (
				<Box sx={{ textAlign: 'center', py: 8, width: '100%' }}>
					<Typography variant="h6" color="text.secondary">
						{query ? t('main-doctor-history.patients_not_found') : t('main-doctor-history.patients_list_empty')}
					</Typography>
				</Box>
			) : (
				<div className="patients-history">
					{filteredPatients.map((patient) => (
						<div className="patients-history-box" key={patient.id}>
							<Avatar sx={{ width: 64, height: 64, mb: 1 }}>
								<PersonIcon fontSize="large" />
							</Avatar>
							<h3>{patient.first_name} {patient.last_name}</h3>
							<p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 10px 0' }}>
								{t('main-doctor-history.iin')} {patient.iin || t('main-doctor-history.ne_ukaz')}
							</p>
							<ColorButton
								variant="contained"
								fullWidth
								onClick={() => handleOpenCard(patient.id)}
							>
								{t('main-doctor-history.open_emc')}
							</ColorButton>
						</div>
					))}
				</div>
			)}
			<PatientMedicalCardModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				patientId={selectedPatientId}
			/>
		</div>
	);
}