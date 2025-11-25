import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import PostJobs from './components/PostJobs';
import JobTracker from './components/JobTracker';
import RoleSelection from './components/RoleSelection';
import EditProfile from './components/EditProfile';
import ProfileBuilder from './components/ProfileBuilder';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/choose-role" element={<RoleSelection />} />
            <Route path="/apply-jobs" element={<JobList />} />
            <Route path="/post-jobs" element={<PostJobs />} />
            <Route path="/job-tracker" element={<JobTracker />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/build-profile" element={<ProfileBuilder />} />
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
