import React, { useState, useEffect } from "react";
import Login from "./login";
import { fetchPatients, fetchMyPatient, getAccessToken, getUserRole, logout } from "./api";
import { Container, Box, Button, Typography, List, ListItem, ListItemText, Alert } from "@mui/material";


function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [data, setData] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            setLoggedIn(true);
            loadData();
        }
    }, []);

    async function loadData() {
        const token = getAccessToken();
        const role = getUserRole();

        try {
            let result;
            if (role === "doctor") {
                result = await fetchPatients(token);
                setData(Array.isArray(result) ? result : []);
            } else if (role === "patient") {
                result = await fetchMyPatient(token);
                setData(result ? [result] : []);
            }
        } catch (err) {
            setError("Ошибка данных API: " + err.message);
            setData([]);
        }
    }

    const handleLogin = () => {
        setLoggedIn(true);
        loadData();
    };

    const handleLogout = () => {
        logout();
        setLoggedIn(false);
        setData([]);
    };

    if (!loggedIn) return <Login onLogin={handleLogin} />;

    return (
        <Container maxWidth="md" sx={{ mt: 5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Добро пожаловать!</Typography>
                <Button variant="contained" color="secondary" onClick={handleLogout}>
                    Выйти
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Typography variant="h5" mb={2}>Пациенты</Typography>
            {data.length === 0 ? (
                <Typography>Нет данных для отображения</Typography>
            ) : (
                <List>
                    {data.map((patient) => (
                        <ListItem key={patient.id} divider>
                            <ListItemText
                                primary={patient.name}
                                secondary={patient.age ? `${patient.age} лет` : "Возраст не указан"}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Container>
    );
}

export default App;
