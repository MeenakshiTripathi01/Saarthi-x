import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import JobList from './components/JobList';
import JobBuilder from './components/JobBuilder';
import JobTracker from './components/JobTracker';
import RoleSelection from './components/RoleSelection';
import EditProfile from './components/EditProfile';
import ProfileBuilder from './components/ProfileBuilder';
import ViewProfile from './components/ViewProfile';
import IndustryApplications from './components/IndustryApplications';
import IndustryHackathons from './components/IndustryHackathons';
import PostHackathon from './components/PostHackathon';
import ApplicantHackathons from './components/ApplicantHackathons';
import HackathonDetails from './components/HackathonDetails';
import HackathonApplicationDashboard from './components/HackathonApplicationDashboard';
import IndustryHackathonDashboard from './components/IndustryHackathonDashboard';
import ApplicantResults from './components/ApplicantResults';
import IndustryHackathonResults from './components/IndustryHackathonResults';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/:role" element={<Login />} />
            <Route path="/choose-role" element={<RoleSelection />} />
            <Route path="/apply-jobs" element={<JobList />} />
            <Route path="/post-jobs" element={<JobBuilder />} />
            <Route path="/job-tracker" element={<JobTracker />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/build-profile" element={<ProfileBuilder />} />
            <Route path="/view-profile" element={<ViewProfile />} />
            <Route path="/manage-applications" element={<IndustryApplications />} />
            <Route path="/manage-hackathons" element={<IndustryHackathons />} />
            <Route path="/post-hackathons" element={<PostHackathon />} />
            <Route path="/browse-hackathons" element={<ApplicantHackathons />} />
            <Route path="/hackathon/:id" element={<HackathonDetails />} />
            <Route path="/hackathon-application/:applicationId" element={<HackathonApplicationDashboard />} />
            <Route path="/industry/hackathon/:hackathonId/dashboard" element={<IndustryHackathonDashboard />} />
            <Route path="/hackathon-application/:applicationId/results" element={<ApplicantResults />} />
            <Route path="/industry/hackathon/:hackathonId/results" element={<IndustryHackathonResults />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
