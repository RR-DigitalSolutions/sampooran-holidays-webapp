import React from "react";
import { Switch, Route, Router, Redirect } from "wouter";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Packages from "./pages/Packages";
import Destinations from "./pages/Destinations";
import Inquiries from "./pages/Inquiries";
import Blogs from "./pages/Blogs";
import Agents from "./pages/Agents";
import Transport from "./pages/Transport";
import Settings from "./pages/Settings";
import UsersPage from "./pages/Users";
import FinancePage from "./pages/Finance";
import SupportPage from "./pages/Support";
import StaffManagement from "./pages/StaffManagement";
import OTAApprovals from "./pages/OTAApprovals";
import PackageForm from "./pages/PackageForm";
import HomePageManager from "./pages/HomePageManager";
import HotelsManager from "./pages/HotelsManager";
import TravelGuides from "./pages/TravelGuides";
import Attractions from "./pages/Attractions";
import DiningPoints from "./pages/DiningPoints";
import Activities from "./pages/Activities";

// Protected route wrapper
function ProtectedRoute({ component: Component }: { component: () => React.ReactElement }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/packages">
        <ProtectedRoute component={Packages} />
      </Route>
      <Route path="/destinations">
        <ProtectedRoute component={Destinations} />
      </Route>
      <Route path="/travel-guides">
        <ProtectedRoute component={TravelGuides} />
      </Route>
      <Route path="/attractions">
        <ProtectedRoute component={Attractions} />
      </Route>
      <Route path="/activities">
        <ProtectedRoute component={Activities} />
      </Route>
      <Route path="/dining">
        <ProtectedRoute component={DiningPoints} />
      </Route>
      <Route path="/inquiries">
        <ProtectedRoute component={Inquiries} />
      </Route>
      <Route path="/blogs">
        <ProtectedRoute component={Blogs} />
      </Route>
      <Route path="/agents">
        <ProtectedRoute component={Agents} />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={UsersPage} />
      </Route>
      <Route path="/finance">
        <ProtectedRoute component={FinancePage} />
      </Route>
      <Route path="/support">
        <ProtectedRoute component={SupportPage} />
      </Route>
      <Route path="/transport">
        <ProtectedRoute component={Transport} />
      </Route>
      <Route path="/staff">
        <ProtectedRoute component={StaffManagement} />
      </Route>
      <Route path="/approvals">
        <ProtectedRoute component={OTAApprovals} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/home-manager">
        <ProtectedRoute component={HomePageManager} />
      </Route>
      <Route path="/hotels-manager">
        <ProtectedRoute component={HotelsManager} />
      </Route>
      <Route path="/packages/new">
        <ProtectedRoute component={PackageForm} />
      </Route>
      <Route path="/packages/:id/edit">
        <ProtectedRoute component={PackageForm} />
      </Route>
      {/* Default redirect */}
      <Route>
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}
