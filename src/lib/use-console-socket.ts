import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "./session";

interface ConsoleSocketOptions {
  namespace?: string;
}

export function useConsoleSocket(options: ConsoleSocketOptions = {}) {
  const { session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if the user is authenticated in the provider console
    if (!session) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Determine the API base URL. Fallback to localhost if not set.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const namespaceUrl = `${baseUrl}${options.namespace || "/console"}`;

    const newSocket = io(namespaceUrl, {
      auth: {
        token: session.sid,
      },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log(`Connected to WebSocket namespace: ${options.namespace || "/console"}`);
    });

    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("Disconnected from WebSocket:", reason);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [session?.sid, options.namespace]);

  return { socket, isConnected };
}
