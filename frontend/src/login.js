import React, { useState } from "react";
import { login, setTokens } from "./api";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

export default function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const data = await login(username, password);

            // Раскодируем payload токена, чтобы получить роль
            const payload = JSON.parse(atob(data.access.split(".")[1]));
            setTokens({ access: data.access, refresh: data.refresh, role: payload.role });

            onLogin(); // уведомляем App о успешном входе
        } catch (err) {
            setError("Неверный логин или пароль");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "50px auto", textAlign: "center" }}>
            <h2>Вход</h2>
            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Email или Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label="Пароль"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                />
                <Button type="submit" variant="contained" fullWidth style={{ marginTop: 16 }}>
                    Войти
                </Button>
            </form>
            {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
        </div>
    );
}
