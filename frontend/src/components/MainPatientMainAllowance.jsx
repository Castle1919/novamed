import React, { useState, useEffect } from 'react';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import {
	Button, Paper, InputBase, IconButton, Box, Typography,
	CircularProgress, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MedicationIcon from '@mui/icons-material/Medication';
import { useTranslation } from 'react-i18next'; // Импортируем хук
import axios from '../api/axios';
import userIcon from '../assets/medicaments1.png';
import userIcon2 from '../assets/medicaments2.png';
import MedicineDetailModal from './MedicineDetailModal';

const ColorButton = styled(Button)(({ theme }) => ({
	color: theme.palette.getContrastText(blue[500]),
	backgroundColor: blue[500],
	'&:hover': {
		backgroundColor: blue[700],
	},
}));

export default function MainPatientMainAllowance() {
	const { t } = useTranslation(); // Инициализируем функцию перевода
	const [medicines, setMedicines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [query, setQuery] = useState('');
	const [filteredMedicines, setFilteredMedicines] = useState([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedMedicine, setSelectedMedicine] = useState(null);

	useEffect(() => {
		const fetchMedicines = async () => {
			try {
				const token = localStorage.getItem('access');
				const response = await axios.get('/patients/active-medicines/', {
					headers: { Authorization: `Bearer ${token}` }
				});

				const sortedMeds = (response.data || []).sort((a, b) =>
					new Date(b.created_at) - new Date(a.created_at)
				);

				setMedicines(sortedMeds);
				setFilteredMedicines(sortedMeds);
			} catch (err) {
				console.error('Error fetching active medicines:', err);
				setError(t('allowancePage.errors.fetchError'));
			} finally {
				setLoading(false);
			}
		};
		fetchMedicines();
	}, [t]); // Добавляем t в зависимости

	useEffect(() => {
		const lowercasedQuery = query.toLowerCase();
		const filtered = medicines.filter(med =>
			med.medicine_name.toLowerCase().includes(lowercasedQuery)
		);
		setFilteredMedicines(filtered);
	}, [query, medicines]);

	const handleDetailClick = (med) => {
		setSelectedMedicine(med);
		setModalOpen(true);
	};

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
				<h2>{t('allowancePage.title')}</h2>
				<Paper
					component="form"
					sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 250 }}
				>
					<InputBase
						sx={{ ml: 1, flex: 1 }}
						placeholder={t('allowancePage.search.placeholder')}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<IconButton type="button" sx={{ p: '10px' }} aria-label={t('allowancePage.search.ariaLabel')}>
						<SearchIcon />
					</IconButton>
				</Paper>
			</div>

			{filteredMedicines.length === 0 ? (
				<Box sx={{ textAlign: 'center', py: 8, width: '100%' }}>
					<MedicationIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
					<Typography variant="h6" color="text.secondary">
						{query ? t('allowancePage.noResults.foundNothing') : t('allowancePage.noResults.noActiveMeds')}
					</Typography>
				</Box>
			) : (
				<div className="patients-history">
					{filteredMedicines.map((med, i) => (
						<div key={med.medicine_id} className="patients-history-box">
							<img src={i % 2 === 0 ? userIcon : userIcon2} alt={med.medicine_name} className="patients-history-box-img" />
							<h3>{med.medicine_name}</h3>
							<ColorButton variant="contained" onClick={() => handleDetailClick(med)}>
								{t('allowancePage.card.detailsButton')}
							</ColorButton>
						</div>
					))}
				</div>
			)}

			<MedicineDetailModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				medicine={selectedMedicine}
			/>
		</div>
	);
}