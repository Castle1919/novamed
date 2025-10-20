import React, { useState, useEffect } from 'react';
import '../App.css';
import logo from '../assets/logo.png';
import Button from '@mui/material/Button';
import MenuIcon from '@mui/icons-material/Menu';
import { IconButton } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ServiceModal from '../components/ModalService';
import ContactsModal from '../components/ModalContacts';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Avatar from '@mui/material/Avatar';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import api from '../api/axios';
import { getAccessToken, getUserRole, logout } from '../api';

export default function MainDoctorMain() {
	const [isModalServiceOpen, setIsModalServiceOpen] = useState(false);
	const [isModalContactsOpen, setIsModalContactsOpen] = useState(false);
	const [anchorEl, setAnchorEl] = useState(null);
	const [anchorEl2, setAnchorEl2] = useState(null);
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	
	const open = Boolean(anchorEl);
	const open2 = Boolean(anchorEl2);

	const ColorButton = styled(Button)(({ theme }) => ({
		color: theme.palette.getContrastText(blue[500]),
		backgroundColor: blue[500],
		'&:hover': {
			backgroundColor: blue[700],
		},
	}));

	useEffect(() => {
		const token = getAccessToken();
		const role = getUserRole();
		
		console.log('MainDoctorMain: token exists:', !!token, 'role:', role);

		if (!token) {
			console.warn('No token found, redirecting to login...');
			navigate('/doctor');
			return;
		}

		const loadProfile = async () => {
			try {
				setLoading(true);
				
				if (role === 'doctor') {
					try {
						const res = await api.get('/doctors/me/');
						const { first_name, last_name } = res.data;
						
						// Проверяем, заполнены ли обязательные поля
						if (!first_name || !last_name) {
							console.log('Doctor profile incomplete, redirecting to profile edit...');
							navigate('/doctor/main/profile?force=true');
							return;
						}
						
						setProfile({ first_name, last_name });
						console.log('Doctor profile loaded:', { first_name, last_name });
					} catch (err) {
						if (err.response && err.response.status === 404) {
							console.log('Doctor profile not found, redirecting to create...');
							navigate('/doctor/main/profile?force=true');
						} else {
							console.error('Error loading doctor profile:', err);
						}
					}
				} else {
					// Если роль не doctor, загружаем базовый профиль
					try {
						const res = await api.get('/accounts/profile/');
						setProfile({ 
							first_name: res.data.username || res.data.email, 
							last_name: '' 
						});
					} catch (err) {
						console.error('Error loading user profile:', err);
					}
				}
			} finally {
				setLoading(false);
			}
		};

		loadProfile();
	}, [navigate]);

	const handleClick = (e) => setAnchorEl(e.currentTarget);
	const handleClick2 = (e) => setAnchorEl2(e.currentTarget);
	const handleClose = () => setAnchorEl(null);
	const handleClose2 = () => setAnchorEl2(null);
	const handleServiceClick = () => setIsModalServiceOpen(true);
	const handleCloseModalService = () => setIsModalServiceOpen(false);
	const handleContactsClick = () => setIsModalContactsOpen(true);
	const handleCloseModalContacts = () => setIsModalContactsOpen(false);

	const handleLogout = () => {
		logout();
		navigate('/');
	};

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
				<Typography variant="h5">Загрузка...</Typography>
			</div>
		);
	}

	return (
		<>
			<Toolbar className='header'>
				<div className='header-left'>
					<IconButton 
						aria-controls={open ? 'basic-menu' : undefined} 
						aria-haspopup="true" 
						aria-expanded={open ? 'true' : undefined} 
						onClick={handleClick}
					>
						<MenuIcon fontSize="large" />
					</IconButton>
					<Menu
						id="basic-menu"
						anchorEl={anchorEl}
						open={open}
						onClose={handleClose}
					>
						<NavLink to="/doctor/main" className='for-navs'>
							<MenuItem onClick={handleClose}>Главная</MenuItem>
						</NavLink>
						<MenuItem onClick={() => { handleClose(); handleServiceClick(); }}>
							Сервисы
						</MenuItem>
						<MenuItem onClick={() => { handleClose(); handleContactsClick(); }}>
							Контакты
						</MenuItem>
					</Menu>
					<NavLink to="/doctor/main" className='for-navs nav-link-main-main'>
						<Typography variant="h6">
							<img src={logo} className='logo' alt="" />
						</Typography>
						<h2 className='logoName'>NovaMed</h2>
					</NavLink>
				</div>
				
				<div className='header-right2' onClick={handleClick2}>
					<h3>{profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Пользователь'}</h3>
					<Avatar sx={{ bgcolor: blue[500] }}>
						{profile?.first_name?.[0]?.toUpperCase() || 'U'}
					</Avatar>
				</div>
				
				<Menu
					id="profile-menu"
					anchorEl={anchorEl2}
					open={open2}
					onClose={handleClose2}
				>
					<NavLink to="/doctor/main/profile" className='for-navs'>
						<MenuItem onClick={handleClose2}>Изменить профиль</MenuItem>
					</NavLink>
					<MenuItem onClick={handleLogout}>Выйти</MenuItem>
				</Menu>
			</Toolbar>

			<div className='wrap-for-patients-view'>
				<div className='pat-btns'>
					<NavLink to="/doctor/main/patients" className='for-navs'>
						<ColorButton variant="contained">Прием пациентов</ColorButton>
					</NavLink>
					<NavLink to="/doctor/main/history" className='for-navs'>
						<ColorButton variant="contained">Пациенты</ColorButton>
					</NavLink>
					<NavLink to="/doctor/main/accounting" className='for-navs'>
						<ColorButton variant="contained">Склад</ColorButton>
					</NavLink>
				</div>
				<div className='cont-for-patients-view'>
					<Outlet />
				</div>
			</div>

			{isModalServiceOpen && <ServiceModal onClose={handleCloseModalService} />}
			{isModalContactsOpen && <ContactsModal onClose={handleCloseModalContacts} />}
		</>
	);
}