import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

/**
 * Connects to the Socket.io server with the current access token.
 * Calls onNotification whenever the server emits "new_notification".
 * Automatically disconnects on unmount or when token becomes null.
 */
export default function useSocket({ token, onNotification }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("new_notification", (notification) => {
      onNotification?.(notification);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return socketRef;
}
