import React from 'react';
import Navbar from '../components/Navbar';

export default function SettingsPage() {
  return (
    <>
      <Navbar />
      <div className="container mt-4 text-white">
        <h2>Settings</h2>
        <div className="card bg-dark text-white p-4 mt-3">
          <h5>General Settings</h5>
          <p className="text-muted">Options and preferences will appear here.</p>
          {/* Add settings content here */}
        </div>
      </div>
    </>
  );
}
