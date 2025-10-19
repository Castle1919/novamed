import api from "../api/axios";
import { getAccessToken } from "../api";

async function getPatients() {
    const token = getAccessToken();
    try {
        const response = await api.get("patients/", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        console.log(response.data);
    } catch (error) {
        console.error("Error fetching patients:", error);
    }
}
