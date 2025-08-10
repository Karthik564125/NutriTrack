import React, { useState, useEffect, useRef } from 'react';
import './healthChat.css';
import { apiUrl } from '../../api';

const HealthChat = ({ user, onClose }) => {
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
    // Load chat history on component mount
    if (user?.id) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(apiUrl(`/api/ai/chat-history/${user.id}`));
      const data = await response.json();
      
      if (data.history && data.history.length > 0) {
        setMessages(data.history);
      } else {
        // Add welcome message
        setMessages([
          {
            message_type: 'ai',
            message: 'Namaste! 🙏 I\'m your Indian health and nutrition expert. Ask me anything about Indian diet, traditional remedies, Ayurvedic practices, or general health questions. I\'ll provide you with Indian context and traditional wisdom!'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([
        {
          message_type: 'ai',
          message: 'Namaste! 🙏 I\'m your Indian health and nutrition expert. Ask me anything about Indian diet, traditional remedies, Ayurvedic practices, or general health questions. I\'ll provide you with Indian context and traditional wisdom!'
        }
      ]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      message_type: 'user',
      message: inputMessage,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/ai/health-chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          userId: user.id
        })
      });

      const data = await response.json();
      
      if (data.response) {
        const aiMessage = {
          message_type: 'ai',
          message: data.response,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        message_type: 'ai',
        message: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
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
          <h2>🧘‍♀️ Indian Health Expert</h2>
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