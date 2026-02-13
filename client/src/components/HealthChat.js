import React, { useState, useEffect, useRef } from 'react';
import './healthChat.css';
import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { chatWithAI } from '../utils/aiService';

const HealthChat = ({ user, onClose, summary }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history on component mount using real-time listener
    if (!user?.uid) return;

    const q = query(
      collection(db, 'chats', user.uid, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Map Firestore schema to component schema
        message_type: doc.data().role,
        message: doc.data().text,
        created_at: doc.data().timestamp?.toDate() || new Date()
      }));

      if (msgs.length > 0) {
        setMessages(msgs);
      } else {
        // Add welcome message if no history
        setMessages([
          {
            message_type: 'ai',
            message: 'Namaste! 🙏 I\'m your Indian health and nutrition expert. Ask me anything about Indian diet, traditional remedies, Ayurvedic practices, or general health questions. I\'ll provide you with Indian context and traditional wisdom!',
            created_at: new Date()
          }
        ]);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      // 1. Save user message to Firestore
      await addDoc(collection(db, 'chats', user.uid, 'messages'), {
        role: 'user',
        text: userText,
        timestamp: serverTimestamp()
      });

      // 2. Call AI Service for response (Direct Client-Side)
      const aiResponse = await chatWithAI(userText, summary);

      if (aiResponse) {
        // 3. Save AI response to Firestore
        await addDoc(collection(db, 'chats', user.uid, 'messages'), {
          role: 'ai',
          text: aiResponse,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error in chat flow:', error);
      // Optional: Show error message in chat (not persisted)
      setMessages(prev => [...prev, {
        message_type: 'ai',
        message: 'Sorry, I\'m having trouble connecting to my brain right now. Please try again later.',
        created_at: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!user?.uid) return;
    if (!window.confirm("Are you sure you want to clear the entire chat history?")) return;

    try {
      const messagesRef = collection(db, 'chats', user.uid, 'messages');
      const snapshot = await getDocs(messagesRef);

      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      setMessages([{
        message_type: 'ai',
        message: 'Namaste! 🙏 I\'m your Indian health and nutrition expert. Ask me anything about Indian diet, traditional remedies, Ayurvedic practices, or general health questions. I\'ll provide you with Indian context and traditional wisdom!',
        created_at: new Date()
      }]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-overlay">
      <div className="chat-container">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2>🧘‍♀️ NutriTrack AI</h2>
            <button onClick={clearChat} className="clear-chat-btn" title="Clear Chat" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#ef4444', fontWeight: 'bold' }}>Delete</button>
          </div>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.message_type}`}>
              <div className="message-content">
                <div className="message-text">{msg.message}</div>
                <div className="message-time">
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="message ai">
              <div className="message-content">
                <div className="message-text">
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about Indian diet, traditional remedies, Ayurveda..."
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || loading}
            className="send-btn"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthChat;