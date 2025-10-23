import React, { useState, useEffect } from 'react';
import '../App.css';
import {
    Toolbar, IconButton, Menu, MenuItem, Typography, Avatar, Button,
    CircularProgress, Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';
import { blue } from '@mui/material/colors';
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from '../assets/logo.png';
import api from '../api/axios';
import { getAccessToken, getUserRole, logout } from '../api';
import ServiceModal from '../components/ModalService';
import ContactsModal from '../components/ModalContacts';
import ProfileModal from '../components/ProfileModal';

const ColorButton = styled(Button)(({ theme }) => ({
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    '&:hover': {
        backgroundColor: blue[700],
    },
}));

const MainDoctorMainComponent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    // Состояния для модальных окон
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Состояния для меню
    const [mainMenuAnchor, setMainMenuAnchor] = useState(null);
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

	const profileMenuButtonRef = React.useRef(null);
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const userRole = getUserRole();

    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            navigate('/doctor');
            return;
        }

        const loadProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get('/doctors/me/');
                const { id, first_name, last_name } = res.data;
                if (!first_name || !last_name) {
                    navigate('/doctor/main/profile?force=true');
                    return;
                }
                setProfile({ id, first_name, last_name });
            } catch (err) {
                if (err.response?.status === 404) {
                    navigate('/doctor/main/profile?force=true');
                } else {
                    console.error('Error loading doctor profile:', err);
                }
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [navigate]);

    // Обработчики главного меню
    const handleMainMenuOpen = (e) => setMainMenuAnchor(e.currentTarget);
    const handleMainMenuClose = () => setMainMenuAnchor(null);

    // Обработчики меню профиля
    const handleProfileMenuOpen = () => {
		setIsProfileMenuOpen(true);
	};

	const handleProfileMenuClose = () => {
		setIsProfileMenuOpen(false);
		// Возвращаем фокус на наш div
		if (profileMenuButtonRef.current) {
			profileMenuButtonRef.current.focus();
		}
	};

    // Обработчики модальных окон
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleProfileModalOpen = () => {
        handleProfileMenuClose(); // Закрываем меню перед открытием модалки
        setIsProfileModalOpen(true);
    };

    const handleProfileModalClose = (shouldReload) => {
        setIsProfileModalOpen(false);
        if (shouldReload) {
            window.location.reload();
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Загрузка профиля...</Typography>
            </Box>
        );
    }

    return (
        <>
            <Toolbar className='header'>
                {/* Левая часть хедера */}
                <div className='header-left'>
                    <IconButton onClick={handleMainMenuOpen}>
                        <MenuIcon fontSize="large" />
                    </IconButton>
                    <Menu anchorEl={mainMenuAnchor} open={Boolean(mainMenuAnchor)} onClose={handleMainMenuClose}>
                        <MenuItem component={NavLink} to="/doctor/main" onClick={handleMainMenuClose}>Главная</MenuItem>
                        <MenuItem onClick={() => { setIsServiceModalOpen(true); handleMainMenuClose(); }}>Сервисы</MenuItem>
                        <MenuItem onClick={() => { setIsContactsModalOpen(true); handleMainMenuClose(); }}>Контакты</MenuItem>
                    </Menu>
                    <NavLink to="/doctor/main" className='for-navs nav-link-main-main'>
                        <img src={logo} className='logo' alt="NovaMed Logo" />
                        <h2 className='logoName'>NovaMed</h2>
                    </NavLink>
                </div>

                {/* Правая часть хедера (профиль) */}
                <div className='header-right2' onClick={handleProfileMenuOpen} ref={profileMenuButtonRef} tabIndex={-1}>
                    <h3>{profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Пользователь'}</h3>
                    <Avatar sx={{ bgcolor: blue[500] }}>
                        {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                </div>
                <Menu anchorEl={profileMenuButtonRef.current} open={isProfileMenuOpen} onClose={handleProfileMenuClose}>
                    <MenuItem onClick={handleProfileModalOpen}>Изменить профиль</MenuItem>
                    <MenuItem onClick={handleLogout}>Выйти</MenuItem>
                </Menu>
            </Toolbar>

            {/* Основной контент */}
            <div className='wrap-for-patients-view'>
                <div className='pat-btns'>
                    <NavLink to="/doctor/main/patients"><ColorButton variant="contained">Прием пациентов</ColorButton></NavLink>
                    <NavLink to="/doctor/main/history"><ColorButton variant="contained">Все пациенты (ЭМК)</ColorButton></NavLink>
                    <NavLink to="/doctor/main/accounting"><ColorButton variant="contained">Склад</ColorButton></NavLink>
                </div>
                <div className='cont-for-patients-view'>
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

// Оборачиваем в React.memo для оптимизации
const MainDoctorMain = React.memo(MainDoctorMainComponent);
export default MainDoctorMain;