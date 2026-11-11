import { lazy, Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import { RequireAuth } from './routes/Guards.jsx';
import { Spinner } from './components/ui.jsx';

const L = (p) => lazy(p);
const Home = L(() => import('./pages/Home.jsx'));
const Vehicles = L(() => import('./pages/Vehicles.jsx'));
const VehicleDetail = L(() => import('./pages/VehicleDetail.jsx'));
const Auctions = L(() => import('./pages/Auctions.jsx'));
const ImportRequest = L(() => import('./pages/ImportRequest.jsx'));
const Calculators = L(() => import('./pages/Calculators.jsx'));
const Auth = L(() => import('./pages/Auth.jsx'));
const Static = L(() => import('./pages/Static.jsx'));
const Account = L(() => import('./pages/account/Account.jsx'));
const Admin = L(() => import('./pages/admin/Admin.jsx'));

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:slug" element={<VehicleDetail />} />
          <Route path="auctions" element={<Auctions />} />
          <Route path="import" element={<ImportRequest />} />
          <Route path="calculators/*" element={<Calculators />} />
          <Route path="calculator" element={<Navigate to="/calculators/tax" replace />} />
          <Route path="login" element={<Auth mode="login" />} />
          <Route path="register" element={<Auth mode="register" />} />
          <Route path="forgot-password" element={<Auth mode="forgot" />} />
          <Route path="reset-password" element={<Auth mode="reset" />} />
          <Route path="verify-email" element={<Auth mode="verify" />} />
          <Route path="account/*" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path=":page" element={<Static />} />
        </Route>
        <Route path="admin/*" element={<RequireAuth staff><Admin /></RequireAuth>} />
      </Routes>
    </Suspense>
  );
}
