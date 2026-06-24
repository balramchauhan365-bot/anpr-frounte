import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import Login          from '../pages/Login';
import Dashboard      from '../pages/Dashboard';
import Logs           from '../pages/Logs';
import Vehicles       from '../pages/Vehicles';
import Users          from '../pages/Users';
import ProductionReport  from '../pages/ProductionReport';
import SupplierCustomer  from '../pages/SupplierCustomer';
import PartyReport       from '../pages/PartyReport';
import SupplierReport    from '../pages/SupplierReport';

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard"          element={<Protected><Dashboard /></Protected>} />
      <Route path="/logs"               element={<Protected><Logs /></Protected>} />
      <Route path="/vehicles"           element={<Protected><Vehicles /></Protected>} />
      <Route path="/users"              element={<Protected><Users /></Protected>} />
      <Route path="/production-report"  element={<Protected><ProductionReport /></Protected>} />
      <Route path="/supplier-customer"  element={<Protected><SupplierCustomer /></Protected>} />
      <Route path="/party-report"       element={<Protected><PartyReport /></Protected>} />
      <Route path="/supplier-report"    element={<Protected><SupplierReport /></Protected>} />
      <Route path="*"                   element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
