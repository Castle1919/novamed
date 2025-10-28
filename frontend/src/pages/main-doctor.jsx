import '../App.css';
import React, { useState } from 'react';
import logo from '../assets/logo.png';
import Button from '@mui/material/Button';
import MenuIcon from '@mui/icons-material/Menu';
import { IconButton, Box } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import RegistrModal from '../components/Registr';
import LoginModal from '../components/Login'; 
import ServiceModal from '../components/ModalService';
import ContactsModal from '../components/ModalContacts';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Footer from '../components/Footer';
import ImgMain from '../assets/doctor-page.png';
import { NavLink } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

function MainDoctor() {

const { t } = useTranslation();
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
	setIsModalOpen(true);
};

const handleCloseModal = () => {
	setIsModalOpen(false);
};

const handleLoginClick = () => {
	setIsModalLoginOpen(true);
};

const handleCloseModalLogin = () => {
	setIsModalLoginOpen(false);
};

const handleServiceClick = () => {
	setIsModalServiceOpen(true);
};

const handleCloseModalService = () => {
	setIsModalServiceOpen(false);
};

const handleContactsClick = () => {
	setIsModalContactsOpen(true);
};

const handleCloseModalContacts = () => {
	setIsModalContactsOpen(false);
};

return (
	<>
		<Toolbar>
    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <IconButton onClick={handleClick}>
            <MenuIcon fontSize="large" />
        </IconButton>
        <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
        >
            <NavLink to="/" className='for-navs'><MenuItem onClick={handleClose}>{t('header.main')}</MenuItem></NavLink>
            <MenuItem onClick={() => { handleServiceClick(); handleClose(); }}>{t('header.services')}</MenuItem>
            <MenuItem onClick={() => { handleContactsClick(); handleClose(); }}>{t('header.contacts')}</MenuItem>
        </Menu>
        <NavLink to="/" className='for-navs nav-link-main-main'>
            <Typography variant="h6">
                <img src={logo} className='logo' alt="" />
            </Typography>
            <h2 className='logoName'>NovaMed</h2>
        </NavLink>
    </Box>

	<Box sx={{ flexGrow: 3 }} />
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LanguageSwitcher />
    </Box>

    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
        <Button variant="contained" onClick={handleRegistrClick} sx={{ minWidth: '150px' }}>{t('header.register')}</Button>
        <Button variant="outlined" onClick={handleLoginClick} sx={{ minWidth: '80px' }}>{t('header.login')}</Button>
    </Box>
</Toolbar>
		
		<div className='mainbox'>
			<div className='mainbox-left'>
				<h2>{t('main-doctor.title')}</h2>
				<p>{t('main-doctor.text')}</p>
			</div>
			<div className='mainbox-right'>
				<img src={ImgMain} alt="No img" />
			</div>
		</div>
		<Footer sx={{ mt: 'auto' }}></Footer>
		
        {isModalOpen && <RegistrModal onClose={handleCloseModal} role="doctor" />}
		{isModalLoginOpen && <LoginModal onClose={handleCloseModalLogin} role="doctor" />}
		
        {isModalServiceOpen && <ServiceModal onClose={handleCloseModalService} />}
		{isModalContactsOpen && <ContactsModal onClose={handleCloseModalContacts} />}
	</>
);
}

export default MainDoctor;