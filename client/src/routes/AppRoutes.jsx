import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Loading from '../components/Loading';
import ProtectedRoute from './ProtectedRoute';

const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const CowPassport = lazy(() => import('../pages/CowPassport'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const MyCows = lazy(() => import('../pages/MyCows'));
const AddCow = lazy(() => import('../pages/AddCow'));
const CowDetails = lazy(() => import('../pages/CowDetails'));
const HealthRecords = lazy(() => import('../pages/HealthRecords'));
const Vaccination = lazy(() => import('../pages/Vaccination'));
const AIDiagnosis = lazy(() => import('../pages/AIDiagnosis'));
const Notifications = lazy(() => import('../pages/Notifications'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const NearbyVets = lazy(() => import('../pages/NearbyVets'));
const AnalyticsDashboard = lazy(() => import('../pages/AnalyticsDashboard'));
const MilkProduction = lazy(() => import('../pages/MilkProduction'));
const AIChatAssistant = lazy(() => import('../pages/AIChatAssistant'));
const PDFHealthReport = lazy(() => import('../pages/PDFHealthReport'));
const VaccinationReminder = lazy(() => import('../pages/VaccinationReminder'));
const NotFound = lazy(() => import('../pages/NotFound'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading fullScreen />}>
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
          <Route path="/health-records" element={<HealthRecords />} />
          <Route path="/vaccination/:cowId" element={<Vaccination />} />
          <Route path="/vaccination" element={<VaccinationReminder />} />
          <Route path="/ai-diagnosis" element={<AIDiagnosis />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/milk-production" element={<MilkProduction />} />
          <Route path="/ai-chat" element={<AIChatAssistant />} />
          <Route path="/pdf-report" element={<PDFHealthReport />} />
          <Route path="/cow-passport" element={<CowPassport />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/nearby-vets" element={<NearbyVets />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;