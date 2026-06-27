import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

/**
 * Connects to the Socket.io server with the current access token.
 * - onNotification: called on "new_notification" events
 * - events: map of { eventName: handler } for any additional socket events
 * Automatically disconnects on unmount or when token becomes null.
 */
export default function useSocket({ token, onNotification, events = {} }) {
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

    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // events object is defined inline at callsite — intentionally excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return socketRef;
}
