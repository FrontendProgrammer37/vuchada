import { Routes, Route, Navigate } from 'react-router-dom';
import EmployeeLayout from '../components/EmployeeLayout';
import EmployeeDashboard from '../pages/employee/Dashboard';
import EmployeePOS from '../pages/employee/PointOfSale';
import EmployeeSales from '../pages/employee/Sales';
import EmployeeProfile from '../pages/employee/Profile';

const EmployeeRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<EmployeeLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="pos" element={<EmployeePOS />} />
        <Route path="sales" element={<EmployeeSales />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default EmployeeRoutes;
