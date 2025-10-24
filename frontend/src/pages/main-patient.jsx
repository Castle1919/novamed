import '../App.css';
import React, { useState } from 'react';
import logo from '../assets/logo.png';
import Button from '@mui/material/Button';
import MenuIcon from '@mui/icons-material/Menu';
import { IconButton } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import RegistrModal from '../components/Registr';
import LoginModal from '../components/LoginPatient';
import ServiceModal from '../components/ModalService';
import ContactsModal from '../components/ModalContacts'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Footer from '../components/Footer';
import ImgMain from '../assets/patient-page.png';
import { NavLink, Outlet } from "react-router-dom";


function MainPatient() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isModalLoginOpen, setIsModalLoginOpen] = useState(false);
	const [isModalServiceOpen, setIsModalServiceOpen] = useState(false);
	const [isModalContactsOpen, setIsModalContactsOpen] = useState(false);

	const [anchorEl, setAnchorEl] = useState(null);
	const open = Boolean(anchorEl);
	const handleClick = (e) => {
		setAnchorEl(e.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

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
						<NavLink to="/" className='for-navs'><MenuItem onClick={handleClose}>Главная</MenuItem></NavLink>
						<MenuItem onClick={handleServiceClick}>Сервисы</MenuItem>
						<MenuItem onClick={handleContactsClick}>Контакты</MenuItem>
					</Menu>
					<NavLink to="/" className='for-navs nav-link-main-main'>
						<Typography variant="h6">
							<img src={logo} className='logo' alt="" />
						</Typography>
						<h2 className='logoName'>NovaMed</h2>
					</NavLink>
				</div>
				<div className='header-right'>
					<Button variant="contained" onClick={handleRegistrClick}>Регистрация</Button>
					<Button variant="outlined" onClick={handleLoginClick}>Вход</Button>
				</div>
			</Toolbar>
			<div className='mainbox'>
				<div className='mainbox-left'>
					<h2>Пациенты — Храбрецы Заботы о Себе</h2>
					<p>Пациенты — это не просто те, кто нуждается в лечении, но настоящие храбрецы, стоящие на фронте своего здоровья. В каждом пациенте пребывает сила и решимость, необходимые для преодоления трудностей и возвращения к полноценной жизни.</p>
				</div>
				<div className='mainbox-right'>
					<img src={ImgMain} alt="No img" />
				</div>
			</div>
			{/* <Outlet /> */}
			<Footer></Footer>
			{isModalOpen && <RegistrModal onClose={handleCloseModal} role="patient" />}
			{isModalLoginOpen && <LoginModal onClose={handleCloseModalLogin} role="patient" />}

			{/* {isModalOpen && <RegistrModal onClose={handleCloseModal} />}
			{isModalLoginOpen && <LoginModal onClose={handleCloseModalLogin} />}
			 */}
			{isModalServiceOpen && <ServiceModal onClose={handleCloseModalService} />}
			{isModalContactsOpen && <ContactsModal onClose={handleCloseModalContacts} />}
		</>
	);
}

export default MainPatient;
