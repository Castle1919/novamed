import React from 'react';
import iconDef from '../assets/def-doctor.png'

export default function MainDoctorMainDefault() {
	return (
		<>
			<div className="def-div">
				<img src={iconDef} alt="" />
				<h2>Выберите действие!</h2>
				<p>Вы можете посмотреть информацию о приемах, узнать информацию о конкретных пациентах или посмотреть доступные лекарства</p>
			</div>
		</>
	)
}
