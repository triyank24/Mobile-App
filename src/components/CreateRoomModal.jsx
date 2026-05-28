import React, { useState } from 'react';

export default function CreateRoomModal({ isOpen, onClose, onCreate }) {
  const [roomName, setRoomName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomName.trim()) {
      onCreate(roomName);
      setRoomName('');
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
        
        <h3 style={{textAlign: 'center', marginBottom: '5px'}}>Create a Room</h3>
        <p style={{textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '25px', fontSize: '13px'}}>
          Give your study room a name
        </p>

        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Room name (e.g. DSA Study Group)" 
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required 
            style={{marginBottom: '20px'}}
          />
          
          <button type="submit" className="btn-primary" style={{width: '100%', marginBottom: '15px'}}>
            Create Room
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
