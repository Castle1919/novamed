import React from 'react';
import {
    Modal, Box, Typography, Divider, IconButton, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { useTranslation } from 'react-i18next';
import { use } from 'react';

const style = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%', maxWidth: 600,
    bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2, p: 3,
};


export default function MedicineDetailModal({ open, onClose, medicine }) {
    const { t } = useTranslation();
    if (!medicine) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <CloseIcon />
                </IconButton>

                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {medicine.name || medicine.medicine_name}
                </Typography>

                {medicine.prescription_required !== undefined && (
                    <Chip
                        label={medicine.prescription_required ? t('medicine-details-modal.recipe_need') : t('medicine-details-modal.no_recipe')}
                        color={medicine.prescription_required ? 'error' : 'success'}
                        size="small"
                        sx={{ mb: 2, width: 'fit-content' }}
                    />
                )}

                <Divider sx={{ mb: 2 }} />

                <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{t('medicine-details-modal.title')}</Typography>
                    <Typography variant="body2">{medicine.description || 'Нет описания.'}</Typography>
                </Box>

                {medicine.side_effects && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon color="warning" />
                            {t('medicine-details-modal.effects')}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>{medicine.side_effects}</Typography>
                    </Box>
                )}

                {medicine.contraindications && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningIcon color="error" />
                            {t('medicine-details-modal.contraindications')}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>{medicine.contraindications}</Typography>
                    </Box>
                )}
            </Box>
        </Modal>
    );
}