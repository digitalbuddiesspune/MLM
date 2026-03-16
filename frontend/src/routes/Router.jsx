import {
  createBrowserRouter,
  createRoutesFromChildren,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "../components/Layout";
import UserLayout from "../components/UserLayout";
import AdminLayout from "../components/AdminLayout";
import RequireRole from "../components/RequireRole";
import Home from "../pages/Home";
import BusinessPlan from "../pages/BusinessPlan";
import Dashboard from "../pages/user/Dashboard";
import Profile from "../pages/user/Profile";
import BinaryTree from "../pages/user/BinaryTree";
import Wallet from "../pages/user/Wallet";
import Transactions from "../pages/user/Transactions";
import GenerationIncome from "../pages/user/GenerationIncome";
import Rewards from "../pages/user/Rewards";
import Rank from "../pages/user/Rank";
import Renewal from "../pages/user/Renewal";
import Team from "../pages/user/Team";
import Support from "../pages/user/Support";
import IncomeReport from "../pages/user/IncomeReport";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers from "../pages/admin/Users";
import Admins from "../pages/admin/Admins";
import AdminPayouts from "../pages/admin/Payouts";
import AdminSettings from "../pages/admin/Settings";
import AdminProducts from "../pages/admin/Products";
import AdminProductForm from "../pages/admin/ProductForm";

const router = createBrowserRouter(
  createRoutesFromChildren(
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<Navigate to="/#about" replace />} />
      <Route path="/business-plan" element={<BusinessPlan />} />
      <Route path="/products" element={<Navigate to="/#products" replace />} />
      <Route path="/contact" element={<Navigate to="/#contact" replace />} />
      <Route path="/login" element={<Navigate to="/" state={{ authModal: 'login' }} replace />} />
      <Route path="/register" element={<Navigate to="/" state={{ authModal: 'register' }} replace />} />
      <Route path="/user" element={<RequireRole allowedRoles={['user']}><UserLayout /></RequireRole>}>
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="binary-tree" element={<BinaryTree />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="income-report" element={<IncomeReport />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="generation-income" element={<GenerationIncome />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="rank" element={<Rank />} />
        <Route path="renewal" element={<Renewal />} />
        <Route path="team" element={<Team />} />
        <Route path="support" element={<Support />} />
      </Route>
      <Route path="/admin" element={<RequireRole allowedRoles={['admin']}><AdminLayout /></RequireRole>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="team" element={<Team />} />
        <Route path="binary-tree" element={<BinaryTree />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="admins" element={<Admins />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/:id/edit" element={<AdminProductForm />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Route>
  )
);

export default router;
