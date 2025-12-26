import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import History from "./pages/history";
import TradePage from "./pages/trade";

// Professional Solar Energy WebGL background
import SolarEnergyBackground from "./components/SolarEnergyBackground";
import ProtectedRoute from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";
import NavigationBar from "./components/navbar";
import { useLocation } from "react-router-dom";

function AppContent() {
    const location = useLocation();

    // Determine active tab based on current route
    const getActiveTab = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard';
        if (path === '/trade') return 'Trade';
        if (path === '/history') return 'History';
        if (path === '/profile') return 'Profile';
        return null;
    };

    return (
        <>
            <SolarEnergyBackground />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes - Require Authentication */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <PageTransition>
                                <Dashboard />
                            </PageTransition>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <PageTransition>
                                <Profile />
                            </PageTransition>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/history"
                    element={
                        <ProtectedRoute>
                            <PageTransition>
                                <History />
                            </PageTransition>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/trade"
                    element={
                        <ProtectedRoute>
                            <PageTransition>
                                <TradePage />
                            </PageTransition>
                        </ProtectedRoute>
                    }
                />
            </Routes>
            {/* Bottom Navigation - Always visible at app level */}
            <NavigationBar active={getActiveTab()} />
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
