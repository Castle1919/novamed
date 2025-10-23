import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import axios from '../api/axios';

export default function ActivationPage() {
    const { uid, token } = useParams();
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        const activate = async () => {
            try {
                const response = await axios.get(`/accounts/activate/${uid}/${token}/`);
                if (response.data.success) {
                    setStatus('success');
                    setMessage(response.data.message);
                }
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Произошла ошибка при активации.');
            }
        };
        activate();
    }, [uid, token]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
            {status === 'loading' && (
                <>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Активация вашего аккаунта...</Typography>
                </>
            )}
            {status === 'success' && (
                <>
                    <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
                    <Typography variant="h5" color="success.main">{message}</Typography>
                    <Typography sx={{ mt: 1 }}>Теперь вы можете войти в систему.</Typography>
                    <Button component={Link} to="/" variant="contained" sx={{ mt: 3 }}>
                        На главную
                    </Button>
                </>
            )}
            {status === 'error' && (
                <>
                    <ErrorIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
                    <Typography variant="h5" color="error.main">{message}</Typography>
                    <Typography sx={{ mt: 1 }}>Попробуйте зарегистрироваться снова или свяжитесь с поддержкой.</Typography>
                    <Button component={Link} to="/" variant="outlined" sx={{ mt: 3 }}>
                        На главную
                    </Button>
                </>
            )}
        </Box>
    );
}