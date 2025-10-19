import React from 'react';
import userIcon from '../assets/medicaments1.png';
import userIcon2 from '../assets/medicaments2.png';
import { blue } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

export default function MainPatientMainAllowance() {
	// Создаем стилизованную кнопку без <ButtonProps>
	const ColorButton = styled(Button)(({ theme }) => ({
		color: theme.palette.getContrastText(blue[500]),
		backgroundColor: blue[500],
		'&:hover': {
			backgroundColor: blue[700],
		},
	}));

	// Список лекарств можно отрисовать циклом, чтобы не копировать вручную
	const meds = Array.from({ length: 24 }, (_, i) => ({
		id: i + 1,
		img: i % 2 === 0 ? userIcon : userIcon2,
		name: 'Medicament',
	}));

	return (
		<div className="patient-history-main">
			<div className="patient-history-input">
				<h2>Лекарств в наличии</h2>
				<Paper
					component="form"
					sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 250 }}
				>
					<InputBase
						sx={{ ml: 1, flex: 1 }}
						placeholder="Введите название"
						inputProps={{ 'aria-label': 'поиск лекарства' }}
					/>
					<IconButton type="button" sx={{ p: '10px' }} aria-label="search">
						<SearchIcon />
					</IconButton>
				</Paper>
			</div>

			<div className="patients-history">
				{meds.map((item) => (
					<div key={item.id} className="patients-history-box">
						<img src={item.img} alt={item.name} className="patients-history-box-img" />
						<h3>{item.name}</h3>
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
	);
}
