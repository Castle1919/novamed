// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, Typography, Box, Chip, CircularProgress } from '@mui/material';
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// import AccessTimeIcon from '@mui/icons-material/AccessTime';
// import PersonIcon from '@mui/icons-material/Person';
// import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
// import axios from '../api/axios';
// import dayjs from 'dayjs';
// import 'dayjs/locale/ru';

// export default function MyAppointments() {
//     const [appointments, setAppointments] = useState([]);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         loadAppointments();
//     }, []);

//     const loadAppointments = async () => {
//         try {
//             const response = await axios.get('/appointments/my/');
//             setAppointments(response.data);
//         } catch (error) {
//             console.error('Ошибка при загрузке записей:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (loading) {
//         return (
//             <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
//                 <CircularProgress />
//             </Box>
//         );
//     }

//     return (
//         <Box sx={{ p: 2 }}>
//             <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
//                 Мои записи
//             </Typography>
            
//             {appointments.length === 0 ? (
//                 <Typography color="text.secondary">У вас пока нет записей</Typography>
//             ) : (
//                 appointments.map((appointment) => (
//                     <Card key={appointment.id} sx={{ mb: 2 }}>
//                         <CardContent>
//                             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
//                                 <Typography variant="h6">
//                                     {appointment.doctor_details?.name}
//                                 </Typography>
//                                 <Chip 
//                                     label={appointment.status === 'scheduled' ? 'Запланировано' : appointment.status}
//                                     color="primary"
//                                     size="small"
//                                 />
//                             </Box>
                            
//                             <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
//                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                     <CalendarTodayIcon fontSize="small" color="action" />
//                                     <Typography variant="body2">
//                                         {dayjs(appointment.date_time).format('DD MMMM YYYY')}
//                                     </Typography>
//                                 </Box>
//                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                     <AccessTimeIcon fontSize="small" color="action" />
//                                     <Typography variant="body2">
//                                         {dayjs(appointment.date_time).format('HH:mm')}
//                                     </Typography>
//                                 </Box>
//                                 {appointment.doctor_details?.office_number && (
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                         <MeetingRoomIcon fontSize="small" color="action" />
//                                         <Typography variant="body2">
//                                             Кабинет {appointment.doctor_details.office_number}
//                                         </Typography>
//                                     </Box>
//                                 )}
//                             </Box>
//                         </CardContent>
//                     </Card>
//                 ))
//             )}
//         </Box>
//     );
// }