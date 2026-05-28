import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc, serverTimestamp, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'rooms'), where('members', 'array-contains', currentUser.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedRooms = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort locally to avoid needing a Firestore composite index
      fetchedRooms.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setRooms(fetchedRooms);
    });
    return unsub;
  }, [currentUser]);

  const handleCreateRoom = async (name) => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await setDoc(doc(db, 'rooms', newCode), {
      name,
      code: newCode,
      ownerId: currentUser?.uid,
      members: [currentUser?.uid],
      createdAt: serverTimestamp()
    });
    setIsCreateOpen(false);
  };

  const handleDeleteRoom = async (e, roomCode) => {
    e.stopPropagation();
    await deleteDoc(doc(db, 'rooms', roomCode));
  };

  const handleJoinRoom = async (code) => {
    const roomCode = code.toUpperCase();
    const roomRef = doc(db, 'rooms', roomCode);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      await updateDoc(roomRef, {
        members: arrayUnion(currentUser?.uid)
      });
      setIsJoinOpen(false);
      navigate(`/room/${roomCode}`);
    } else {
      alert("Room not found! Please check the code.");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container" style={{marginBottom: 0}}>
          <div className="logo-icon" style={{width: 30, height: 30, fontSize: 16}}>S</div>
          <h2 className="logo-text" style={{fontSize: 20}}>StudyHub</h2>
        </div>
        
        <button className="btn-outline" style={{marginTop: 'auto', width: '100%', borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.05)'}} onClick={() => navigate('/')}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Your Rooms</h1>
            <p className="subtitle" style={{marginBottom: 0, marginTop: '5px'}}>Create or join your study rooms</p>
          </div>
          <div style={{display: 'flex', gap: '15px'}}>
            <button className="btn-outline" onClick={() => setIsCreateOpen(true)}>+ Create Room</button>
            <button className="btn-primary" onClick={() => setIsJoinOpen(true)}>Join Room</button>
          </div>
        </div>

        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room.id} className="room-card glass-panel" onClick={() => navigate(`/room/${room.code}`)}>
              <h3>{room.name}</h3>
              <div className="room-code-badge">Code: {room.code}</div>
              
              {room.ownerId === currentUser?.uid && (
                <button className="btn-delete" onClick={(e) => handleDeleteRoom(e, room.code)}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <CreateRoomModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreate={handleCreateRoom}
      />

      <JoinRoomModal 
        isOpen={isJoinOpen} 
        onClose={() => setIsJoinOpen(false)} 
        onJoin={handleJoinRoom}
      />
    </div>
  );
}
