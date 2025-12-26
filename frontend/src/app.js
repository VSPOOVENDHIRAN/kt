import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import History from "./pages/history";
import TradePage from "./pages/trade";
<<<<<<< HEAD
=======
import GovtLedger from "./pages/govtledger";
import AnimatedBackground from "./components/AnimatedBackgroundPure";
import WelcomeHeader from "./components/WelcomeHeader";
>>>>>>> 64d8f2e578277c5883404b34541da60f42517c95

function App() {
  return (
    <BrowserRouter>
<<<<<<< HEAD
=======
      <AnimatedBackground />
      <WelcomeHeader />
>>>>>>> 64d8f2e578277c5883404b34541da60f42517c95
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/trade" element={<TradePage />} />
<<<<<<< HEAD
=======
        <Route path="/govtledger" element={<GovtLedger />} />
>>>>>>> 64d8f2e578277c5883404b34541da60f42517c95
      </Routes>
    </BrowserRouter>
  );
}

export default App;
