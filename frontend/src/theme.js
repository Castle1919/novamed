import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    typography: {
        fontFamily: [
            'Modern-H',
            // 'Roboto',
            // '-apple-system',
            // 'BlinkMacSystemFont',
            // '"Segoe UI"',
            // 'Arial',
            // 'sans-serif',
        ].join(','),
    },
});

export default theme;