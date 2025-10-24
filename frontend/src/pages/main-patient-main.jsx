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

    // Состояния для модальных окон
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Состояния для меню
    const [mainMenuAnchor, setMainMenuAnchor] = useState(null);
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
    const profileMenuButtonRef = useRef(null); // Ref для кнопки профиля

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

    // Обработчики главного меню
    const handleMainMenuOpen = (e) => setMainMenuAnchor(e.currentTarget);
    const handleMainMenuClose = () => setMainMenuAnchor(null);

    // Обработчики меню профиля
    const handleProfileMenuOpen = (e) => setProfileMenuAnchor(e.currentTarget);
    const handleProfileMenuClose = () => {
        setProfileMenuAnchor(null);
        // Возвращаем фокус на элемент, открывший меню
        if (profileMenuButtonRef.current) {
            profileMenuButtonRef.current.focus();
        }
    };

    // Обработчики модальных окон
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
        // Перезагружаем страницу ТОЛЬКО если сохранение было успешным
        if (wasSuccessful) {
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
            <Toolbar className="header">
                {/* Левая часть хедера */}
                <div className="header-left">
                    <IconButton onClick={handleMainMenuOpen}>
                        <MenuIcon fontSize="large" />
                    </IconButton>
                    <Menu anchorEl={mainMenuAnchor} open={Boolean(mainMenuAnchor)} onClose={handleMainMenuClose}>
                        <MenuItem component={NavLink} to="/patient/main" onClick={handleMainMenuClose}>Главная</MenuItem>
                        <MenuItem onClick={() => { setIsServiceModalOpen(true); handleMainMenuClose(); }}>Сервисы</MenuItem>
                        <MenuItem onClick={() => { setIsContactsModalOpen(true); handleMainMenuClose(); }}>Контакты</MenuItem>
                    </Menu>
                    <NavLink to="/patient/main" className='for-navs nav-link-main-main'>
                        <img src={logo} className='logo' alt="NovaMed Logo" />
                        <h2 className='logoName'>NovaMed</h2>
                    </NavLink>
                </div>

                {/* Правая часть хедера (профиль) */}
                <div 
                    className='header-right2' 
                    onClick={handleProfileMenuOpen}
                    ref={profileMenuButtonRef} // Привязываем Ref
                    tabIndex={-1} // Делаем элемент фокусируемым, но не для навигации Tab
                    style={{ outline: 'none' }} // Убираем стандартную рамку фокуса
                >
                    <h3>{profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Пациент'}</h3>
                    <Avatar sx={{ bgcolor: blue[500] }}>
                        {profile?.first_name?.[0]?.toUpperCase() || 'П'}
                    </Avatar>
                </div>
                <Menu 
                    anchorEl={profileMenuAnchor} 
                    open={Boolean(profileMenuAnchor)} 
                    onClose={handleProfileMenuClose}
                    // Убираем фокус с меню при его закрытии
                    autoFocus={false}
                >
                    <MenuItem onClick={handleProfileModalOpen}>Изменить профиль</MenuItem>
                    <MenuItem onClick={handleLogout}>Выйти</MenuItem>
                </Menu>
            </Toolbar>

            {/* Основной контент */}
            <div className="wrap-for-patients-view">
                <div className="pat-btns">
                    <NavLink to="/patient/main/doctors"><ColorButton variant="contained">Запись к врачу</ColorButton></NavLink>
                    <NavLink to="/patient/main/allowance"><ColorButton variant="contained">Доступные лекарства</ColorButton></NavLink>
                    <NavLink to="/patient/main/appointments"><ColorButton variant="contained">Мои записи</ColorButton></NavLink>
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