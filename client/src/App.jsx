import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Sales from './pages/Sales';
import PurchaseOrders from './pages/PurchaseOrders';
import Returns from './pages/Returns';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { isAuth, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  return isAuth ? children : <Navigate to="/login" replace/>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element={<PrivateRoute><Layout/></PrivateRoute>}>
          <Route index element={<Dashboard/>}/>
          <Route path="inventory" element={<Inventory/>}/>
          <Route path="pos" element={<POS/>}/>
          <Route path="sales" element={<Sales/>}/>
          <Route path="purchase-orders" element={<PurchaseOrders/>}/>
          <Route path="returns" element={<Returns/>}/>
        </Route>
      </Routes>
    </AuthProvider>
  );
}