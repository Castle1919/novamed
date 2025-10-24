import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import GitHubIcon from '@mui/icons-material/GitHub';

export default function Footer() {
  return (
    <Paper 
      component='footer'
      sx={{
        // --- Начало изменений для позиционирования ---
        position: 'fixed', // 1. Жестко позиционируем относительно окна браузера
        bottom: 0,         // 2. Прижимаем к низу
        left: 0,           // 3. Растягиваем от левого края...
        right: 0,          // 4. ...до правого края (на всю ширину)
        // --- Конец изменений для позиционирования ---

        // Внутреннее устройство футера (остается как было)
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        
        // Стили оформления
        bgcolor: 'primary.dark',
        color: '#fff',
        p: 2,
        // borderRadius убираем, так как он теперь всегда внизу и не должен иметь скруглений
        // borderRadius: { xs: 0, sm: 1 }, 
        zIndex: (theme) => theme.zIndex.appBar, // Устанавливаем z-index, чтобы футер был поверх другого контента
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* ...иконки... */}
        <IconButton color="inherit" aria-label="facebook">
          <FacebookRoundedIcon />
        </IconButton>
        <IconButton color="inherit" aria-label="instagram">
          <InstagramIcon />
        </IconButton>
        <IconButton color="inherit" aria-label="youtube">
          <YouTubeIcon />
        </IconButton>
        <Divider 
          orientation="vertical"
          flexItem
          sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} 
        />
        <IconButton color="inherit" aria-label="GitHub">
          <GitHubIcon />
        </IconButton>
      </Box>

      <Typography variant="body2">
        ©️ Diplom
      </Typography>
    </Paper >
  );
}