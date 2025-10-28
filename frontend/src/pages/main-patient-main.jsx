import React, { useState, useEffect, useRef } from 'react';
import '../App.css';
import {
    Toolbar, IconButton, Menu, MenuItem, Typography, Avatar, Button,
    Box, CircularProgress
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';
import { blue } from '@mui/material/colors';
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from '../assets/logo.png';
import api from "../api/axios";
import { getAccessToken, getUserRole, logout } from "../api";
import ServiceModal from '../components/ModalService';
import ContactsModal from '../components/ModalContacts';
import ProfileModal from '../components/ProfileModal';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';


const ColorButton = styled(Button)(({ theme }) => ({
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    '&:hover': {
        backgroundColor: blue[700],
    },
}));

const MainPatientMainComponent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const { t } = useTranslation();
    
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const [mainMenuAnchor, setMainMenuAnchor] = useState(null);
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
    const profileMenuButtonRef = useRef(null); 
    
    // [ИЗМЕНЕНИЕ] Это состояние больше не нужно и удалено, так как ваши обработчики его не используют.
    // const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const userRole = getUserRole();

    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            navigate('/patient');
            return;
        }
        const loadProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get('/patients/me/');
                const { id, first_name, last_name } = res.data;
                if (!first_name || !last_name) {
                    setIsProfileModalOpen(true);
                }
                setProfile({ id, first_name, last_name });
            } catch (err) {
                console.error('Ошибка при получении профиля пациента:', err);
                if (err.response?.status === 404) {
                    setIsProfileModalOpen(true);
                }
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [navigate]);

    const handleMainMenuOpen = (e) => setMainMenuAnchor(e.currentTarget);
    const handleMainMenuClose = () => setMainMenuAnchor(null);

    // ВАШИ ОБРАБОТЧИКИ ОСТАЛИСЬ БЕЗ ИЗМЕНЕНИЙ
    const handleProfileMenuOpen = (e) => setProfileMenuAnchor(e.currentTarget);
    const handleProfileMenuClose = () => {
        setProfileMenuAnchor(null);
        if (profileMenuButtonRef.current) {
            profileMenuButtonRef.current.focus();
        }
    };

    const handleLogout = () => {
        handleProfileMenuClose();
        logout();
        navigate('/');
    };

    const handleProfileModalOpen = () => {
        handleProfileMenuClose();
        setIsProfileModalOpen(true);
    };

    const handleProfileModalClose = (wasSuccessful) => {
        setIsProfileModalOpen(false);
        if (wasSuccessful) {
            window.location.reload();
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>{t('loadingProfile')}</Typography>
            </Box>
        );
    }

    return (
        <>
            {/* ВАШ БЛОК TOOLBAR С МИНИМАЛЬНЫМИ ИСПРАВЛЕНИЯМИ */}
            <Toolbar>
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    <IconButton onClick={handleMainMenuOpen}>
                        <MenuIcon fontSize="large" />
                    </IconButton>
                    <Menu anchorEl={mainMenuAnchor} open={Boolean(mainMenuAnchor)} onClose={handleMainMenuClose}>
                        {/* Исправил путь для пациента */}
                        <MenuItem component={NavLink} to="/patient/main" onClick={handleMainMenuClose}>{t('header.main')}</MenuItem>
                        <MenuItem onClick={() => { setIsServiceModalOpen(true); handleMainMenuClose(); }}>{t('header.services')}</MenuItem>
                        <MenuItem onClick={() => { setIsContactsModalOpen(true); handleMainMenuClose(); }}>{t('header.contacts')}</MenuItem>
                    </Menu>
                    {/* Исправил путь для пациента */}
                    <NavLink to="/patient/main" className='for-navs nav-link-main-main'>
                        <img src={logo} className='logo' alt="NovaMed Logo" />
                        <h2 className='logoName'>NovaMed</h2>
                    </NavLink>
                </Box>

                <Box sx={{ flexGrow: 3 }} />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LanguageSwitcher />
                </Box>

                <Box 
                    sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, cursor: 'pointer' }}
                    onClick={handleProfileMenuOpen} 
                    ref={profileMenuButtonRef}
                >
                    <h3>{profile ? `${profile.first_name} ${profile.last_name}`.trim() : t('header.user')}</h3>
                    <Avatar sx={{ bgcolor: blue[500] }}>
                        {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                </Box>
                
                {/* [ИЗМЕНЕНИЕ] Здесь Menu теперь слушает правильные состояния, которые меняют ВАШИ обработчики */}
                <Menu 
                    anchorEl={profileMenuAnchor} 
                    open={Boolean(profileMenuAnchor)} 
                    onClose={handleProfileMenuClose}
                >
                    <MenuItem onClick={handleProfileModalOpen}>{t('header.edit_profile')}</MenuItem>
                    <MenuItem onClick={handleLogout}>{t('header.logout')}</MenuItem>
                </Menu>
            </Toolbar>

            {/* Основной контент */}
            <div className="wrap-for-patients-view">
                <div className="pat-btns">
                    <NavLink to="/patient/main/doctors"><ColorButton variant="contained">{t('patientNav.bookDoctor')}</ColorButton></NavLink>
                    <NavLink to="/patient/main/allowance"><ColorButton variant="contained">{t('patientNav.availableMeds')}</ColorButton></NavLink>
                    <NavLink to="/patient/main/appointments"><ColorButton variant="contained">{t('patientNav.myAppointments')}</ColorButton></NavLink>
                </div>
                <div className="cont-for-patients-view">
                    <Outlet context={{ profile }} />
                </div>
            </div>

            {/* Модальные окна */}
            {isServiceModalOpen && <ServiceModal onClose={() => setIsServiceModalOpen(false)} />}
            {isContactsModalOpen && <ContactsModal onClose={() => setIsContactsModalOpen(false)} />}
            <ProfileModal
                open={isProfileModalOpen}
                onClose={handleProfileModalClose}
                role={userRole}
            />
        </>
    );
};

const MainPatientMain = React.memo(MainPatientMainComponent);
export default MainPatientMain;