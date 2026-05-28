import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal from '../components/AuthModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);

  const openAuth = (loginMode) => {
    setIsLoginMode(loginMode);
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = () => {
    setIsAuthOpen(false);
    navigate('/dashboard');
  };
  
  return (
    <div className="landing-container">
      <div className="landing-card glass-panel">
        <div className="logo-container">
          <div className="logo-icon">S</div>
          <h1 className="logo-text">StudyHub</h1>
        </div>
        
        <p className="subtitle">
          A simple platform to create rooms, share notes, and collaborate with video conferencing.
        </p>
        
        <div className="badges">
          <span className="badge"><span className="badge-dot" style={{backgroundColor: '#4ade80'}}></span> Study Rooms</span>
          <span className="badge"><span className="badge-dot" style={{backgroundColor: '#f87171'}}></span> Shared Notes</span>
          <span className="badge"><span className="badge-dot" style={{backgroundColor: '#a78bfa'}}></span> Video Calls</span>
        </div>
        
        <div className="auth-buttons">
          <button className="btn-outline" onClick={() => openAuth(true)}>Login</button>
          <button className="btn-primary" onClick={() => openAuth(false)}>Sign Up</button>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        defaultIsLogin={isLoginMode}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
