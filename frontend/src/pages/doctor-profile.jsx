import React, { useState } from 'react';
import EditDoctorProfile from '../components/EditDoctorProfile';
import { useLocation } from 'react-router-dom';

export default function DoctorProfilePage() {
  const [open, setOpen] = useState(true);
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const force = params.get('force') === 'true';

  const handleClose = () => setOpen(false);
  return (
    <div>
      <EditDoctorProfile open={open} onClose={handleClose} onSaved={() => { window.location.href = '/doctor/main'; }} disableClose={force} />
    </div>
  );
}
