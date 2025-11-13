import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import PostJobs from './components/PostJobs';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/apply-jobs" element={<JobList />} />
            <Route path="/post-jobs" element={<PostJobs />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
