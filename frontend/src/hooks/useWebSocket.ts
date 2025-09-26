import { useState, useEffect, useRef, useCallback } from 'react';
import type { TaskComment } from '../types';

interface UseWebSocketProps {
  orgSlug: string;
  taskId: string;
  onNewComment: (comment: TaskComment) => void;
}

export const useWebSocket = ({ orgSlug, taskId, onNewComment }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const heartbeatInterval = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);
  
  // Store the callback in a ref to avoid dependency changes
  const onNewCommentRef = useRef(onNewComment);
  onNewCommentRef.current = onNewComment;

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = undefined;
    }
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = undefined;
    }
    if (ws.current) {
      ws.current.close(1000, 'Component unmounting');
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;
    if (ws.current && ws.current.readyState === WebSocket.CONNECTING) return;
    
    // Clean up existing connection
    if (ws.current) {
      ws.current.close();
    }

    const rawToken = localStorage.getItem('authToken');
    if (!rawToken) {
      setError('No authentication token found');
      return;
    }

    const token = rawToken.startsWith('JWT ') ? rawToken.slice(4) : rawToken;
    const wsUrl = `ws://localhost:8000/ws/tasks/${orgSlug}/${taskId}/comments/?token=${token}`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        
        // Send heartbeat every 25s to keep connection alive
        heartbeatInterval.current = setInterval(() => {
          if (ws.current && ws.current.readyState === WebSocket.OPEN && mountedRef.current) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.current.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          
          // Handle pong responses
          if (data.type === 'pong') {
            return;
          }
          
          if (data.content && data.author) {
            const comment: TaskComment = {
              id: data.id,
              content: data.content,
              author: {
                id: data.author.id,
                name: data.author.email.split('@')[0],
                email: data.author.email
              },
              timestamp: data.timestamp
            };
            onNewCommentRef.current(comment);
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.current.onerror = (err) => {
        if (!mountedRef.current) return;
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
      };

      ws.current.onclose = (event) => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = undefined;
        }

        // Only reconnect if it wasn't a normal closure and component is still mounted
        if (event.code !== 1000 && mountedRef.current) {
          console.log('Attempting to reconnect in 3 seconds...');
          reconnectTimeout.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, 3000);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
    }
  }, [orgSlug, taskId]);

  const sendMessage = useCallback((message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message }));
      return true;
    } else {
      setError('WebSocket is not connected');
      return false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Add a small delay to prevent immediate connection/disconnection in development
    const connectTimer = setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(connectTimer);
      disconnect();
    };
  }, [connect, disconnect]);

  return { 
    isConnected, 
    error, 
    sendMessage, 
    reconnect: connect 
  };
};