import React from 'react'
import iconDef from '../assets/def-patient.png'
import { useTranslation } from 'react-i18next';

export default function MainPatientMainDefault() {
	const { t } = useTranslation();
	return (
		<>
			<div className="def-div">
				<img src={iconDef} alt="" />
				<h2>{t('patient-default.title')}</h2>
				<p>{t('patient-default.text')}</p>
			</div>
		</>
	)
}
