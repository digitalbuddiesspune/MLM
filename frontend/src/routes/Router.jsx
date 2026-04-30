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
import MyPlan from "../pages/user/MyPlan";
import UserMyHierarchy from "../pages/user/level/MyHierarchy";
import UserMyUserList from "../pages/user/level/MyUserList";
import UserMyDirect from "../pages/user/level/MyDirect";
import UserAllHierarchy from "../pages/user/level/AllHierarchy";
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
import AdminMyHierarchy from "../pages/admin/level/MyHierarchy";
import AdminMyUserList from "../pages/admin/level/MyUserList";
import AdminMyDirect from "../pages/admin/level/MyDirect";
import AdminAllHierarchy from "../pages/admin/level/AllHierarchy";
import AdminUsers from "../pages/admin/Users";
import Admins from "../pages/admin/Admins";
import AdminPayouts from "../pages/admin/Payouts";
import AdminSettings from "../pages/admin/Settings";
import AdminProducts from "../pages/admin/Products";
import AdminProductForm from "../pages/admin/ProductForm";
import Ekyc from "../pages/user/Ekyc";
import KycApprovals from "../pages/admin/KycApprovals";
import Checkout from "../pages/Checkout";
import AdminOrders from "../pages/admin/Orders";
import AdminUserWallets from "../pages/admin/UserWallets";
import Cart from "../pages/Cart";

const router = createBrowserRouter(
  createRoutesFromChildren(
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<Navigate to="/#about" replace />} />
      <Route path="/business-plan" element={<BusinessPlan />} />
      <Route path="/products" element={<Navigate to="/#products" replace />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<RequireRole allowedRoles={['user']}><Checkout /></RequireRole>} />
      <Route path="/contact" element={<Navigate to="/#contact" replace />} />
      <Route path="/login" element={<Navigate to="/" state={{ authModal: 'login' }} replace />} />
      <Route path="/register" element={<Navigate to="/" state={{ authModal: 'register' }} replace />} />
      <Route path="/user" element={<RequireRole allowedRoles={['user']}><UserLayout /></RequireRole>}>
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="level/my-hierarchy" element={<UserMyHierarchy />} />
        <Route path="level/my-user-list" element={<UserMyUserList />} />
        <Route path="level/my-direct" element={<UserMyDirect />} />
        <Route path="level/all-hierarchy" element={<UserAllHierarchy />} />
        <Route path="my-plan" element={<MyPlan />} />
        <Route path="profile" element={<Profile />} />
        <Route path="ekyc" element={<Ekyc />} />
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
        <Route path="level/my-hierarchy" element={<AdminMyHierarchy />} />
        <Route path="level/my-user-list" element={<AdminMyUserList />} />
        <Route path="level/my-direct" element={<AdminMyDirect />} />
        <Route path="level/all-hierarchy" element={<AdminAllHierarchy />} />
        <Route path="team" element={<Team />} />
        <Route path="binary-tree" element={<BinaryTree />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="admins" element={<Admins />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="user-wallets" element={<AdminUserWallets />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/:id/edit" element={<AdminProductForm />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="kyc-approvals" element={<KycApprovals />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Route>
  )
);

export default router;
