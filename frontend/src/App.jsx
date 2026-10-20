import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { Empty, RequireAuth } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import { Categories, CategoryPlans } from './pages/Catalog.jsx';
import PlanDetails from './pages/PlanDetails.jsx';
import { Login, Register } from './pages/Auth.jsx';
import { ClaimDetail, Claims, Dashboard, MyPolicies, NewClaim, Profile } from './pages/Customer.jsx';
import Support from './pages/Support.jsx';
import { AdminClaimReview, AdminClaims, AdminDashboard, AdminPlans, AdminUsers } from './pages/admin/Admin.jsx';

function NotFound() {
  return (
    <div className="container section">
      <Empty title="Page not found" text="The page you are looking for does not exist." action={<Link to="/" className="btn btn-primary">Go home</Link>} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route index element={<Home />} />
        <Route path="insurance" element={<Categories />} />
        <Route path="insurance/:slug" element={<CategoryPlans />} />
        <Route path="plans/:id" element={<PlanDetails />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="support" element={<Support />} />
        <Route path="claims" element={<Claims />} />

        {/* Logged-in customer */}
        <Route path="dashboard" element={<RequireAuth role="user"><Dashboard /></RequireAuth>} />
        <Route path="policies" element={<RequireAuth role="user"><MyPolicies /></RequireAuth>} />
        <Route path="claims/new" element={<RequireAuth role="user"><NewClaim /></RequireAuth>} />
        <Route path="claims/:id" element={<RequireAuth><ClaimDetail /></RequireAuth>} />
        <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />

        {/* Admin */}
        <Route path="admin" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
        <Route path="admin/claims" element={<RequireAuth role="admin"><AdminClaims /></RequireAuth>} />
        <Route path="admin/claims/:id" element={<RequireAuth role="admin"><AdminClaimReview /></RequireAuth>} />
        <Route path="admin/plans" element={<RequireAuth role="admin"><AdminPlans /></RequireAuth>} />
        <Route path="admin/users" element={<RequireAuth role="admin"><AdminUsers /></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
