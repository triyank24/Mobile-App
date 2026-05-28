import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BsMic, BsCameraVideo, BsDisplay, BsJournalText, BsTelephoneX, BsFileEarmarkText } from 'react-icons/bs';
import Whiteboard from '../components/Whiteboard';
import Chat from '../components/Chat';
import Peer from 'peerjs';
import { db, rtdb } from '../services/firebase';
import { ref, push, onChildAdded, onDisconnect, remove as rtdbRemove } from 'firebase/database';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const VideoPlayer = ({ stream }) => {
  const videoRef = useRef();
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Android/iOS WebViews often require explicit play() for remote WebRTC streams
      videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
    }
  }, [stream]);
  return <video ref={videoRef} autoPlay playsInline webkit-playsinline="true" style={{width: '400px', height: '250px', backgroundColor: '#000', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 5px 15px rgba(0,0,0,0.5)'}} />;
};

const RoomNotesModal = ({ isOpen, onClose, roomId, ownerId }) => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, `rooms/${roomId}/notes`), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [isOpen, roomId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // limit size to 500kb since we use firestore base64 instead of storage
    if (file.size > 500 * 1024) {
      alert("File is too large for the free tier. Please upload a file smaller than 500KB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target.result;
      try {
        await addDoc(collection(db, `rooms/${roomId}/notes`), {
          fileName: file.name,
          fileType: file.type,
          data: base64String,
          uploadedBy: currentUser?.email || 'Guest',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to upload", err);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteNote = async (noteId) => {
    await deleteDoc(doc(db, `rooms/${roomId}/notes`, noteId));
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <h3 style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px'}}>
          <BsFileEarmarkText /> Room Notes
        </h3>
        
        <div style={{display: 'flex', gap: '10px', marginBottom: '30px', alignItems: 'center'}}>
          <input type="file" onChange={handleFileUpload} disabled={uploading} style={{marginBottom: 0, padding: '10px', flex: 1}} />
          {uploading && <span style={{fontSize: '12px'}}>Uploading...</span>}
        </div>
        
        <div style={{maxHeight: '200px', overflowY: 'auto', marginBottom: '30px', width: '100%'}}>
          {notes.length === 0 && <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>No notes yet</p>}
          {notes.map(note => (
            <div key={note.id} style={{display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px'}}>
               <div>
                 <div style={{fontSize: '14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{note.fileName}</div>
                 <div style={{fontSize: '11px', color: 'var(--text-secondary)'}}>by {note.uploadedBy}</div>
                 <a href={note.data} download={note.fileName} style={{fontSize: '12px', color: 'var(--secondary-accent)'}}>Download</a>
               </div>
               {currentUser?.uid === ownerId && (
                 <button className="btn-outline" style={{padding: '5px 10px', color: '#ff4444', borderColor: '#ff4444', height: 'fit-content'}} onClick={() => handleDeleteNote(note.id)}>Delete</button>
               )}
            </div>
          ))}
        </div>

        <p style={{fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'center'}} onClick={onClose}>
          &larr; Back to room
        </p>
      </div>
    </div>
  );
};

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [hasJoined, setHasJoined] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [ownerId, setOwnerId] = useState(null);
  const [showWhiteboard, setShowWhiteboard] = useState(true);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    // Fetch room details to check ownership
    const fetchRoom = async () => {
      const roomSnap = await getDoc(doc(db, 'rooms', roomId));
      if (roomSnap.exists()) {
        setOwnerId(roomSnap.data().ownerId);
      }
    };
    fetchRoom();
  }, [roomId]);
  
  // WebRTC States
  const [peers, setPeers] = useState({});
  const myVideoRef = useRef(null);
  const myStreamRef = useRef(null);
  const peerInstance = useRef(null);

  useEffect(() => {
    if (!hasJoined) return;

    // Get Local Media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myStreamRef.current = stream;
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }

      // Initialize PeerJS with explicit STUN servers for Mobile NAT traversal
      const peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });
      peerInstance.current = peer;

      peer.on('open', (id) => {
        // Broadcast joined event
        const roomRef = ref(rtdb, `rooms/${roomId}/participants`);
        const participantRef = push(roomRef, { peerId: id, email: currentUser?.email || 'Guest' });
        
        // Remove from DB when disconnected
        onDisconnect(participantRef).remove();
      });

      // Receive calls
      peer.on('call', (call) => {
        call.answer(stream);
        call.on('stream', (userVideoStream) => {
          setPeers(prev => ({ ...prev, [call.peer]: userVideoStream }));
        });
      });

      // Listen for new users joining
      const roomRef = ref(rtdb, `rooms/${roomId}/participants`);
      const unsub = onChildAdded(roomRef, (data) => {
        const participant = data.val();
        if (participant.peerId !== peer.id) {
          // Call the new user
          const call = peer.call(participant.peerId, stream);
          if (call) {
            call.on('stream', (userVideoStream) => {
              setPeers(prev => ({ ...prev, [participant.peerId]: userVideoStream }));
            });
          }
        }
      });

      return () => {
        unsub();
      };
    }).catch(err => {
      console.error("Failed to get local stream", err);
      alert("Please allow camera and microphone access to join the conference.");
    });

    return () => {
      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
    };
  }, [hasJoined, roomId, currentUser]);
  
  if (!hasJoined) {
    return (
      <div className="landing-container">
        <div className="landing-card glass-panel" style={{maxWidth: '450px'}}>
          <h2 style={{marginBottom: '5px'}}>Room Dashboard</h2>
          <p style={{color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '14px'}}>
            Choose what you want to do
          </p>
          
          <div style={{display: 'flex', gap: '15px', width: '100%'}}>
            <button className="btn-outline" style={{flex: 1, display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '10px'}} onClick={() => setHasJoined(true)}>
              <BsCameraVideo style={{marginRight: '5px'}} /> Join Conference
            </button>
            <button className="btn-primary" style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}} onClick={() => setIsNotesOpen(true)}>
              <BsJournalText /> Notes
            </button>
          </div>
          
          <p style={{marginTop: '30px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer'}} onClick={() => navigate('/dashboard')}>
            &larr; Back to dashboard
          </p>
        </div>

        <RoomNotesModal isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} roomId={roomId} ownerId={ownerId} />
      </div>
    );
  }

  return (
    <div className="conference-container">
      {/* Video Area */}
      <div className="video-area">
         <div className="video-grid" style={{flexWrap: 'wrap', overflowY: 'auto'}}>
            <video 
              ref={myVideoRef} 
              autoPlay 
              playsInline
              muted 
              style={{width: '400px', height: '250px', backgroundColor: '#000', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', transform: 'scaleX(-1)'}} 
            />
            {Object.keys(peers).map(peerId => (
              <VideoPlayer key={peerId} stream={peers[peerId]} />
            ))}
         </div>
         
         <div className="control-bar">
            <button className="control-btn" onClick={() => setShowWhiteboard(!showWhiteboard)} title="Toggle Whiteboard" style={{backgroundColor: showWhiteboard ? 'rgba(138, 43, 226, 0.5)' : ''}}>
               <BsDisplay />
            </button>
            <button className="control-btn" onClick={() => setShowChat(!showChat)} title="Toggle Chat" style={{backgroundColor: showChat ? 'rgba(138, 43, 226, 0.5)' : ''}}>
               <BsJournalText />
            </button>
            <button className="control-btn" onClick={() => setIsNotesOpen(true)} title="Room Notes">
               <BsFileEarmarkText />
            </button>
            <button className="control-btn danger-btn" onClick={() => navigate('/dashboard')} title="Leave Room">
               <BsTelephoneX />
            </button>
         </div>
      </div>

      {/* Sidebar Area */}
      {(showWhiteboard || showChat) && (
        <div className="conference-sidebar" style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
           {showWhiteboard && (
             <div className="whiteboard-section" style={{height: showChat ? '50%' : '100%', flex: showChat ? 'none' : 1, display: 'flex', flexDirection: 'column'}}>
                <div className="sidebar-header">Whiteboard</div>
                <div style={{flex: 1, position: 'relative'}}>
                   <Whiteboard roomId={roomId} />
                </div>
             </div>
           )}
           
           {showChat && (
             <div className="chat-section" style={{height: showWhiteboard ? '50%' : '100%', flex: showWhiteboard ? 'none' : 1, display: 'flex', flexDirection: 'column'}}>
                <div className="sidebar-header">Chat</div>
                <Chat roomId={roomId} />
             </div>
           )}
        </div>
      )}

      <RoomNotesModal isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} roomId={roomId} ownerId={ownerId} />
    </div>
  );
}
