import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import CowPassport from '../pages/CowPassport';
import Dashboard from '../pages/Dashboard';
import MyCows from '../pages/MyCows';
import AddCow from '../pages/AddCow';
import CowDetails from '../pages/CowDetails';
import HealthRecords from '../pages/HealthRecords';
import Vaccination from '../pages/Vaccination';
import AIDiagnosis from '../pages/AIDiagnosis';
import Notifications from '../pages/Notifications';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import NearbyVets from '../pages/NearbyVets';
import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/passport/:id" element={<CowPassport />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-cows" element={<MyCows />} />
          <Route path="/add-cow" element={<AddCow />} />
          <Route path="/cow-details/:id" element={<CowDetails />} />
          <Route path="/health-records/:cowId" element={<HealthRecords />} />
          <Route path="/vaccination/:cowId" element={<Vaccination />} />
          <Route path="/ai-diagnosis" element={<AIDiagnosis />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/nearby-vets" element={<NearbyVets />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;