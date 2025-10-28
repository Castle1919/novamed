import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ContPng1 from '../assets/contacts1.png';
import ContPng2 from '../assets/contacts2.png';
import ContPng3 from '../assets/contacts3.png';
import { useTranslation } from 'react-i18next';

const style = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 400,
	bgcolor: 'background.paper',
	boxShadow: 24,
	textAlign: 'center',
	borderRadius: 8,
	pt: 2,
	px: 4,
	pb: 3,
};

export default function ModalContacts({ onClose }) {
	const handleClose = () => {
		onClose();
	};
	const { t } = useTranslation('services');

	return (
		<Modal
			open={true}
			onClose={onClose}
			aria-labelledby="child-modal-title"
			aria-describedby="child-modal-description"
		>
			<Box sx={{ ...style, width: 900 }}>
				<h2 id="parent-modal-title">{t('contacts.title')}</h2>

				<div className="services-divs">
					<div className="services-div2">
						<img src={ContPng1} alt="" />
						<h2>{t('contacts.reception')}</h2>
						<p>Телефон: +7 (777) 777-7777</p>
						<p>Email: reception@gmail.com</p>
					</div>

					<div className="services-div2">
						<img src={ContPng3} alt="" />
						<h2>{t('contacts.hospital')}</h2>
						<p>{t('contacts.address')}</p>
						<p>Телефон: +7 (777) 777-7777</p>
						<p>Email: info@gmail.com</p>
					</div>

					<div className="services-div2">
						<img src={ContPng2} alt="" />
						<h2>{t('contacts.ceo')}</h2>
						<p>Телефон: +7 (777) 777-7777</p>
						<p>Email: director@gmail.com</p>
					</div>
				</div>

				<Button onClick={handleClose}>{t('contacts.close')}</Button>
			</Box>
		</Modal>
	);
}
