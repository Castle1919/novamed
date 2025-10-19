import '../App.css';
import React from 'react';
import mainDocImg from '../assets/main-doc.png';
import mainPatImg from '../assets/main-patient.png';
import { NavLink } from 'react-router-dom';

function App() {
	return (
		<>
			<div className="container-main">
				<div className="wrapper-main">
					<NavLink to="/doctor" className="wrapper-main-item" id="wrapper-main-item1">
						<img src={mainDocImg} className="wrapper-main-item-imgs" alt="No img" />
						<h1 className="wrapper-main-item-h1">Вы Врач</h1>
					</NavLink>

					<NavLink to="/patient" className="wrapper-main-item" id="wrapper-main-item2">
						<img src={mainPatImg} className="wrapper-main-item-imgs" alt="No img" />
						<h1 className="wrapper-main-item-h1">Вы Пациент</h1>
						{/* <Skeleton variant="circular" width={210} height={210} animation="wave" />
            <Skeleton variant="text" animation="wave" width={150} height={70} /> */}
					</NavLink>
				</div>
			</div>
		</>
	);
}

export default App;
