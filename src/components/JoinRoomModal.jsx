import React, { useState } from 'react';

export default function JoinRoomModal({ isOpen, onClose, onJoin }) {
  const [roomCode, setRoomCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomCode.trim()) {
      onJoin(roomCode);
      setRoomCode('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
           <div className="logo-container" style={{justifyContent: 'center', marginBottom: '10px'}}>
              <div className="logo-icon" style={{width: 35, height: 35, fontSize: 18}}>S</div>
              <h2 className="logo-text" style={{fontSize: 22}}>StudyHub</h2>
           </div>
        </div>
        
        <h3 style={{textAlign: 'center', marginBottom: '5px'}}>Join a Room</h3>
        <p style={{textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '25px', fontSize: '13px'}}>
          Enter the room code shared with you
        </p>

        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="e.g. AB12CD" 
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            required 
            style={{marginBottom: '20px', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase'}}
          />
          
          <button type="submit" className="btn-primary" style={{width: '100%', marginBottom: '15px'}}>
            Join Room
          </button>
        </form>

        <p 
          style={{textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer'}}
          onClick={onClose}
        >
          &larr; Back to Dashboard
        </p>
      </div>
    </div>
  );
}
