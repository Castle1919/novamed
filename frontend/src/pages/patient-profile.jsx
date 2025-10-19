import React, { useState } from 'react';
import EditPatientProfile from '../components/EditPatientProfile';

export default function PatientProfilePage() {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <EditPatientProfile open={open} onClose={() => setOpen(false)} onSaved={() => { window.location.href = '/patient/main'; }} />
    </div>
  );
}
