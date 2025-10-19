import React from 'react'
import iconDef from '../assets/def-patient.png'

export default function MainPatientMainDefault() {
	return (
		<>
			<div className="def-div">
				<img src={iconDef} alt="" />
				<h2>Выберите действие!</h2>
				<p>Вы можете посмотреть информацию и записаться на прием, узнать информацию о врачах или посмотреть доступные вам лекарства</p>
			</div>
		</>
	)
}
