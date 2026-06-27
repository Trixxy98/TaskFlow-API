import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";
const SocketContext = createContext(null);

/**
 * Single shared socket connection for the entire app.
 * Provides the socket instance to any component via useSocketContext().
 */
export function SocketProvider({ token, onNotification, children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    s.on("new_notification", (notification) => {
      onNotification?.(notification);
    });

    setSocket(s);

    return () => {
      s.off();
      s.disconnect();
    };
  }, [token]); // onNotification intentionally excluded — wrap with useCallback at callsite

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

/**
 * Returns the shared Socket.io instance.
 * May be null if user is not authenticated yet.
 *
 * Usage:
 *   const socket = useSocketContext();
 *   useEffect(() => {
 *     if (!socket) return;
 *     socket.on("my_event", handler);
 *     return () => socket.off("my_event", handler);
 *   }, [socket]);
 */
export const useSocketContext = () => useContext(SocketContext);
