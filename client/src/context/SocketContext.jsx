import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeNotification, setRealtimeNotification] = useState(null);

  useEffect(() => {
    // Connect to server (using window.location.origin or port 5000)
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to server ID:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
    });

    // Real-time toast notifications
    socketInstance.on('ticket:message_added', (data) => {
      setRealtimeNotification({
        type: 'message',
        title: 'New Response Received',
        text: `${data.message?.sender_name}: ${data.message?.message?.substring(0, 60)}...`,
        ticket_id: data.ticket_id
      });
      setTimeout(() => setRealtimeNotification(null), 5000);
    });

    socketInstance.on('ticket:created', (ticket) => {
      setRealtimeNotification({
        type: 'ticket',
        title: 'New Support Ticket Raised',
        text: `[${ticket.ticket_id}] ${ticket.subject}`,
        ticket_id: ticket.ticket_id
      });
      setTimeout(() => setRealtimeNotification(null), 5000);
    });

    socketInstance.on('ticket:updated', (ticket) => {
      setRealtimeNotification({
        type: 'update',
        title: 'Ticket Status Updated',
        text: `Ticket #${ticket.ticket_id} is now ${ticket.status}`,
        ticket_id: ticket.ticket_id
      });
      setTimeout(() => setRealtimeNotification(null), 4000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, realtimeNotification }}>
      {children}
      {realtimeNotification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f3a2e',
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          borderLeft: '5px solid #f59e0b',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          maxWidth: '360px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚡ Real-Time Update
            </span>
            <button 
              onClick={() => setRealtimeNotification(null)}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕
            </button>
          </div>
          <strong style={{ fontSize: '13px' }}>{realtimeNotification.title}</strong>
          <span style={{ fontSize: '12px', opacity: 0.9 }}>{realtimeNotification.text}</span>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
