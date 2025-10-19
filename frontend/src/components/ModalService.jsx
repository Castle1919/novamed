import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ServPng1 from '../assets/services1.png';
import ServPng2 from '../assets/services2.png';
import ServPng3 from '../assets/services3.png';

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

export default function ModalService({ onClose }) {
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      aria-labelledby="child-modal-title"
      aria-describedby="child-modal-description"
    >
      <Box sx={{ ...style, width: 900 }}>
        <h2 id="parent-modal-title">Сервисы</h2>
        <div className="services-divs">
          <div className="services-div">
            <img src={ServPng1} alt="" />
            <h2>Выберите своего врача!</h2>
            <p>
              Откройте возможности для заботы о своем здоровье – у нас есть широкий
              выбор врачей. Записывайтесь к опытным специалистам, чтобы получить
              качественное медицинское обслуживание.
            </p>
          </div>
          <div className="services-div">
            <img src={ServPng2} alt="" />
            <h2>Получите помощь в нужное вам время!</h2>
            <p>
              Мы понимаем, что ваше время ценно. Записываясь к врачу через наш сервис,
              вы можете быть уверены, что вас ждет встреча в удобное для вас время.
              Получите помощь, не нарушая график.
            </p>
          </div>
          <div className="services-div">
            <img src={ServPng3} alt="" />
            <h2>Надежность без сбоев!</h2>
            <p>
              Наш сервис работает надежно и безотказно. Доверьтесь нам в вопросах
              здоровья, и вы убедитесь, что мы делаем все возможное для качественного
              обслуживания. Ваше здоровье – наш приоритет.
            </p>
          </div>
        </div>

        <Button onClick={handleClose}>Закрыть</Button>
      </Box>
    </Modal>
  );
}
