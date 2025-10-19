import React from 'react';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import Divider from '@mui/joy/Divider';
import Sheet from '@mui/joy/Sheet';
import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import GitHubIcon from '@mui/icons-material/GitHub';

export default function Footer() {
  const color = 'primary';
  const bgColor = color !== 'neutral' ? `${color}.800` : undefined;

  return (
    <Sheet
      id="footer"
      variant="solid"
      color="primary"
      invertedColors
      sx={{
        bgcolor: bgColor,
        flexGrow: 1,
        p: 2,
        borderRadius: { xs: 0, sm: 'sm' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton variant="plain">
          <FacebookRoundedIcon />
        </IconButton>
        <IconButton variant="plain">
          <InstagramIcon />
        </IconButton>
        <IconButton variant="plain">
          <YouTubeIcon />
        </IconButton>
        <Divider orientation="vertical" />
        <IconButton variant="plain">
          <GitHubIcon />
        </IconButton>
      </Box>
      <p>©️ Diplom</p>
    </Sheet>
  );
}
