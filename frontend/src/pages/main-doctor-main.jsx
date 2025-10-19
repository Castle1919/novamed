import React, { useState } from 'react';
import '../App.css';
import logo from '../assets/logo.png';
import Button from '@mui/material/Button';
import MenuIcon from '@mui/icons-material/Menu';
import { IconButton } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import RegistrModal from '../components/Registr';
import CreateDoctorProfile from '../components/CreateDoctorProfile';
import LoginModal from '../components/Login';
import ServiceModal from '../components/ModalService';
import ContactsModal from '../components/ModalContacts';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { NavLink, Outlet } from "react-router-dom";
import Avatar from '@mui/material/Avatar';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import api from '../api/axios';
import { getAccessToken, getUserRole } from '../api';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MainDoctorMain() {

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isModalLoginOpen, setIsModalLoginOpen] = useState(false);
	const [isModalServiceOpen, setIsModalServiceOpen] = useState(false);
	const [isModalContactsOpen, setIsModalContactsOpen] = useState(false);

	const [anchorEl, setAnchorEl] = useState(null);
	const [anchorEl2, setAnchorEl2] = useState(null);
	const [profile, setProfile] = useState(null);
	const navigate = useNavigate();
	const open = Boolean(anchorEl);
	const open2 = Boolean(anchorEl2);
	const handleClick = (e) => {
		setAnchorEl(e.currentTarget);
	};
	const handleClick2 = (e) => {
		setAnchorEl2(e.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};
	const handleClose2 = () => {
		setAnchorEl2(null);
	};

	useEffect(() => {
		const token = getAccessToken();
		const role = getUserRole();
		if (!token) return;

			const load = async () => {
			try {
				if (role === 'doctor') {
											const res = await api.get('/doctors/me/');
											// if doctor exists but required fields empty, consider incomplete
											const first = res.data.first_name;
											const last = res.data.last_name;
											if (!first || !last) {
													// redirect to profile edit page and make it non-closable
													navigate('/doctor/main/profile?force=true');
													// ensure the profile page knows to disable close via query param
													return;
											}
											setProfile({ first_name: first, last_name: last });
				} else if (role === 'patient') {
					const res = await api.get('/patients/me/');
					setProfile({ first_name: res.data.first_name, last_name: res.data.last_name });
				} else {
					const res = await api.get('/accounts/profile/');
					setProfile({ first_name: res.data.username || res.data.email, last_name: '' });
				}
			} catch (err) {
				// if doctor profile missing (first time), open edit form forcibly
				console.error('Ошибка получения профиля:', err);
				if (role === 'doctor') {
											// If 404 or other, redirect to profile page which will open non-closable edit
											navigate('/doctor/main/profile?force=true');
				}
			}
		};
		load();
	}, []);

	const handleRegistrClick = () => {
		setIsModalOpen(true)
	};

	const handleCloseModal = () => {
		setIsModalOpen(false)
	};

	const handleLoginClick = () => {
		setIsModalLoginOpen(true)
	};

	const handleCloseModalLogin = () => {
		setIsModalLoginOpen(false)
	};

	const handleServiceClick = () => {
		setIsModalServiceOpen(true)
	};

	const handleCloseModalService = () => {
		setIsModalServiceOpen(false)
	};

	const handleContactsClick = () => {
		setIsModalContactsOpen(true)
	};

	const handleCloseModalContacts = () => {
		setIsModalContactsOpen(false)
	};

	const ColorButton = styled(Button)(({ theme }) => ({
		color: theme.palette.getContrastText(blue[500]),
		backgroundColor: blue[500],
		'&:hover': {
			backgroundColor: blue[700],
		},
	}));

	return (
		<>
			<Toolbar className='header'>
				<div className='header-left'>
					<IconButton aria-controls={open ? 'basic-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined} onClick={handleClick}>
						<MenuIcon fontSize="large" />
					</IconButton>
					<Menu
						id="basic-menu"
						anchorEl={anchorEl}
						open={open}
						onClose={handleClose}
						MenuListProps={{
							'aria-labelledby': 'basic-button',
						}}
					>
						<NavLink to="/doctor/main" className='for-navs'><MenuItem onClick={handleClose}>Главная</MenuItem></NavLink>
						<MenuItem onClick={handleServiceClick}>Сервисы</MenuItem>
						<MenuItem onClick={handleContactsClick}>Контакты</MenuItem>
					</Menu>
					<NavLink to="/doctor/main" className='for-navs nav-link-main-main'>
						<Typography variant="h6">
							<img src={logo} className='logo' alt="" />
						</Typography>
						<h2 className='logoName'>Patient Registration</h2>
					</NavLink>

				</div>
				<div className='header-right2' onClick={handleClick2}>
					<h3>{profile ? `${profile.first_name} ${profile.last_name}` : 'User'}</h3>
					<Avatar sx={{ bgcolor: blue[500] }}>{profile ? (profile.first_name?.[0] || 'U') : 'U'}</Avatar>
				</div>
				<Menu
					id="basic-menu"
					anchorEl={anchorEl2}
					open={open2}
					onClose={handleClose2}
					MenuListProps={{
						'aria-labelledby': 'basic-button',
					}}
				>
					<NavLink to="/doctor/main/profile" className='for-navs'><MenuItem onClick={handleClose2}>Изменить профиль</MenuItem></NavLink>
					<NavLink to="/" className='for-navs'><MenuItem onClick={handleClose2}>Выйти</MenuItem></NavLink>
				</Menu>
			</Toolbar>
			<div className='wrap-for-patients-view'>
				<div className='pat-btns'>
					<NavLink to="/doctor/main/patients" className='for-navs'><ColorButton variant="contained">Прием пациентов</ColorButton></NavLink>
					<NavLink to="/doctor/main/history" className='for-navs'><ColorButton variant="contained">Пациенты</ColorButton></NavLink>
					<NavLink to="/doctor/main/accounting" className='for-navs'><ColorButton variant="contained">Склад</ColorButton></NavLink>
				</div>
				<div className='cont-for-patients-view'>
					<Outlet></Outlet>
				</div>
			</div>

			{isModalOpen && <RegistrModal onClose={handleCloseModal} />}
			{isModalLoginOpen && <LoginModal onClose={handleCloseModalLogin} />}
			{isModalServiceOpen && <ServiceModal onClose={handleCloseModalService} />}
			{isModalContactsOpen && <ContactsModal onClose={handleCloseModalContacts} />}
			{/* Doctor profile creation modal (auto-open if first-time doctor) */}
			{isModalOpen && profile === null && (
				<CreateDoctorProfile open={true} disableClose={true} onCreated={(d) => setProfile({ first_name: d.first_name, last_name: d.last_name })} />
			)}
            
		</>
	);
}