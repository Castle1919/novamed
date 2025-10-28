import React, { useState, useEffect } from 'react';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import axios from '../api/axios';
import userIcon from '../assets/medicaments1.png';
import userIcon2 from '../assets/medicaments2.png';
import MedicineDetailModal from './MedicineDetailModal';
import { useTranslation } from 'react-i18next';

const ColorButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(blue[500]),
  backgroundColor: blue[500],
  '&:hover': {
    backgroundColor: blue[700],
  },
}));

export default function MainDoctorMainAccounting() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const { t } = useTranslation();

  const handleDetailClick = (med) => {
    const medDataForModal = { ...med, medicine_name: med.name };
    setSelectedMedicine(medDataForModal);
    setModalOpen(true);
  };
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const token = localStorage.getItem('access');
        const response = await axios.get('/medicines/list/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMedicines(response.data || []);
        setFilteredMedicines(response.data || []);
      } catch (err) {
        console.error('Error fetching medicines:', err);
        setError('Не удалось загрузить список препаратов.');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, []);

  useEffect(() => {
    const lowercasedQuery = query.toLowerCase();
    const filtered = medicines.filter(med =>
      med.name.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredMedicines(filtered);

  }, [query, medicines]);

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
        <h2>{t("medicine-warehouse.title")}</h2>
        <Paper
          component="form"
          sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 250 }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder={t("medicine-warehouse.search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
            <SearchIcon />
          </IconButton>
        </Paper>
      </div>
      {filteredMedicines.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, width: '100%' }}>
          <Typography variant="h6" color="text.secondary">
            {query ? t("medicine-warehouse.no_results") : t("medicine-warehouse.empty_warehouse")}
          </Typography>
        </Box>
      ) : (
        <div className="patients-history">
          {filteredMedicines.map((med, i) => (
            <div key={med.id} className="patients-history-box">
              <img src={i % 2 === 0 ? userIcon : userIcon2} alt={med.name} className="patients-history-box-img" />
              <h3>{med.name}</h3>
              <ColorButton variant="contained" onClick={() => handleDetailClick(med)}>
                {t("medicine-warehouse.details_button")}
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