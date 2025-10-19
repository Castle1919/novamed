import React from 'react';
import userIcon from '../assets/user-icon.png';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

export default function MainDoctorMainHistory() {
	const ColorButton = styled(Button)(({ theme }) => ({
		color: theme.palette.getContrastText(blue[500]),
		backgroundColor: blue[500],
		'&:hover': {
			backgroundColor: blue[700],
		},
	}));

	return (
		<>
			<div className="patient-history-main">
				<div className="patient-history-input">
					<h2>Наши пациенты</h2>
					<Paper
						component="form"
						sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 250 }}
					>
						<InputBase
							sx={{ ml: 1, flex: 1 }}
							placeholder="Введите имя пациента"
							inputProps={{ 'aria-label': 'search patient' }}
						/>
						<IconButton type="button" sx={{ p: '10px' }} aria-label="search">
							<SearchIcon />
						</IconButton>
					</Paper>
				</div>

				<div className="patients-history">
					{Array.from({ length: 20 }).map((_, i) => (
						<div className="patients-history-box" key={i}>
							<img src={userIcon} alt="Пациент" className="patients-history-box-img" />
							<h3>Name Name</h3>
							<ColorButton
								className="cont-for-cards-with-patients-box-btn"
								variant="contained"
							>
								Подробнее
							</ColorButton>
						</div>
					))}
				</div>
			</div>
		</>
	);
}
