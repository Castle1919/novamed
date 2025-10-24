import '../App.css';
import React from 'react';
import mainDocImg from '../assets/main-doc.png';
import mainPatImg from '../assets/main-patient.png';
import { NavLink } from 'react-router-dom';
import {useTranslation} from "react-i18next";

function App() {
	const { t } = useTranslation();
	return (
		<>
			<div className="container-main">
				<div className="wrapper-main">
					<NavLink to="/doctor" className="wrapper-main-item" id="wrapper-main-item1">
						<img src={mainDocImg} className="wrapper-main-item-imgs" alt="No img" />
						<h1 className="wrapper-main-item-h1">{t('app.you_doctor')}</h1>
					</NavLink>

					<NavLink to="/patient" className="wrapper-main-item" id="wrapper-main-item2">
						<img src={mainPatImg} className="wrapper-main-item-imgs" alt="No img" />
						<h1 className="wrapper-main-item-h1">{t('app.you_patient')}</h1>
						</NavLink>
				</div>
			</div>
		</>
	);
}

export default App;
