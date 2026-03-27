"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/** Returns a singleton Socket.IO client, connected lazily. */
export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

/** React hook that gives access to the socket and cleans up on unmount. */
export function useSocket() {
  const ref = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    ref.current = getSocket();
    return () => {
      // Do not disconnect on unmount — socket is shared across the app.
      // Individual listeners are removed per-component.
    };
  }, []);

  return ref.current ?? getSocket();
}
