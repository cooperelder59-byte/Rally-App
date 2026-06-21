import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TeamProvider } from './context/TeamContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import TeamSetup from './pages/TeamSetup';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Schedule from './pages/Schedule';
import Performance from './pages/Performance';
import Roster from './pages/Roster';

export default function App() {
  return (
    <TeamProvider>
      <Router>
        <Routes>

          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/team-setup" element={<TeamSetup />} />

          {/* App layout routes */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/roster" element={<Roster />} />
            <Route path="/performance" element={<Performance />} />
          </Route>

        </Routes>
      </Router>
    </TeamProvider>
  );
}