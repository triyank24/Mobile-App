import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function Chat({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const { currentUser } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, `rooms/${roomId}/chat`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsubscribe;
  }, [roomId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = text;
    setText('');
    try {
      await addDoc(collection(db, `rooms/${roomId}/chat`), {
        text: msg,
        uid: currentUser?.uid || 'anonymous',
        email: currentUser?.email || 'Guest',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error adding message: ", e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-messages" style={{ overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.length === 0 && <div style={{textAlign:'center', color: '#888', marginTop: '20px', fontSize: '13px'}}>No messages yet. Say hi!</div>}
        {messages.map(msg => (
          <div key={msg.id} style={{
            alignSelf: msg.uid === currentUser?.uid ? 'flex-end' : 'flex-start',
            backgroundColor: msg.uid === currentUser?.uid ? 'var(--primary-accent)' : '#e0e0e0',
            color: msg.uid === currentUser?.uid ? 'white' : 'black',
            padding: '8px 12px',
            borderRadius: '12px',
            maxWidth: '80%',
            fontSize: '13px'
          }}>
            <div style={{fontSize: '10px', opacity: 0.7, marginBottom: '2px'}}>{msg.email.split('@')[0]}</div>
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input-area" onSubmit={sendMessage}>
        <input 
          type="text" 
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..." 
          style={{marginBottom: 0, backgroundColor: '#f0f0f0', color: 'black', border: 'none', flex: 1}} 
        />
        <button type="submit" className="btn-primary" style={{padding: '12px', borderRadius: '8px', width: 'auto'}}>Send</button>
      </form>
    </div>
  );
}
