import React from 'react';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import JobList from './components/JobList';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <JobList />
      </div>
    </AuthProvider>
  );
}

export default App;
