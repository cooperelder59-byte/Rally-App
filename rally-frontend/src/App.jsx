import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import MainLayout from './components/MainLayout';

function Dashboard() {
  return <div><h2>Dashboard</h2><p>Welcome to Rally!</p></div>;
}

function Messages() {
  return <div><h2>Messages</h2><p>Messages coming soon...</p></div>;
}

function Schedule() {
  return <div><h2>Schedule</h2><p>Schedule coming soon...</p></div>;
}

function Performance() {
  return <div><h2>Performance</h2><p>Performance coming soon...</p></div>;
}

function Team() {
  return <div><h2>Team</h2><p>Team settings coming soon...</p></div>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<div>Login page coming soon</div>} />
        <Route path="/*" element={
          <MainLayout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/team" element={<Team />} />
            </Routes>
          </MainLayout>
        } />
      </Routes>
    </Router>
  );
}