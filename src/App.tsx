import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MasterData from './pages/MasterData';
import WorkOrders from './pages/WorkOrders';
import ProductionPlanning from './pages/ProductionPlanning';
import WorkshopExecution from './pages/WorkshopExecution';
import QualityControl from './pages/QualityControl';
import Inventory from './pages/Inventory';
import OverTime from './pages/OverTime';
import Reporting from './pages/Reporting';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { WorkOrderProvider } from './context/WorkOrderContext';
import { MasterDataProvider } from './context/MasterDataContext';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';

import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthReady } = useFirebase();

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  console.log('App rendering');
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <MasterDataProvider>
          <WorkOrderProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="master-data/*" element={<MasterData />} />
                  <Route path="work-orders/*" element={<WorkOrders />} />
                  <Route path="planning/*" element={<ProductionPlanning />} />
                  <Route path="workshop/*" element={<WorkshopExecution />} />
                  <Route path="quality/*" element={<QualityControl />} />
                  <Route path="inventory/*" element={<Inventory />} />
                  <Route path="overtime/*" element={<OverTime />} />
                  <Route path="reporting/*" element={<Reporting />} />
                  <Route path="settings/*" element={<Settings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </WorkOrderProvider>
        </MasterDataProvider>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
