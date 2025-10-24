import React from 'react';
import iconDef from '../assets/def-doctor.png'
import {useTranslation} from "react-i18next";

export default function MainDoctorMainDefault() {
	const { t } = useTranslation();
	return (
		<>
			<div className="def-div">
				<img src={iconDef} alt="" />
				<h2>{t('main-doctor-default.title')}</h2>
				<p>{t('main-doctor-default.text')}</p>
			</div>
		</>
	)
}
