import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button } from '@mui/material';

const languages = [
    { code: 'ru', name: 'Рус' },
    { code: 'kk', name: 'Қаз' },
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <Box>
            {languages.map((lng) => (
                <Button
                    key={lng.code}
                    onClick={() => changeLanguage(lng.code)}
                    disabled={i18n.language === lng.code}
                    sx={{ fontWeight: i18n.language === lng.code ? 'bold' : 'normal' }}
                >
                    {lng.name}
                </Button>
            ))}
        </Box>
    );
}