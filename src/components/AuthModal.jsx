import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export default function AuthModal({ isOpen, onClose, defaultIsLogin = false, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '1088412470643-uvl7hmhp43n3o2mffohoiq460g6n294n.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        await signInWithCredential(auth, credential);
        onLoginSuccess();
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        onLoginSuccess();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google Login failed. Make sure SHA-1 is correct.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
           <div className="logo-container" style={{justifyContent: 'center'}}>
              <div className="logo-icon" style={{width: 35, height: 35, fontSize: 18}}>S</div>
              <h2 className="logo-text" style={{fontSize: 22}}>StudyHub</h2>
           </div>
        </div>
        
        <p style={{textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '14px'}}>
          {isLogin ? 'Login to your account' : 'Create your account'}
        </p>

        {error && <div style={{backgroundColor: 'rgba(255,0,0,0.1)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', textAlign: 'center'}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          
          <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '10px', marginBottom: '10px'}}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div style={{textAlign: 'center', marginBottom: '10px'}}>
          <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>OR</span>
        </div>

        <button type="button" className="btn-outline" style={{width: '100%'}} onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <p style={{textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)'}}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{color: 'var(--secondary-accent)', cursor: 'pointer', fontWeight: '600'}}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}
