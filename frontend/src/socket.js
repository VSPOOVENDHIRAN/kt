// /src/socket.js
import { io } from "socket.io-client";

// Export the base Socket.io manager, but don't connect it yet.
// We will manage the connection state elsewhere.
const socket = io("http://localhost:5001", {
  autoConnect: false, // <--- CRUCIAL CHANGE: PREVENT IMMEDIATE CONNECTION
  reconnection: true,
  // We'll add the 'auth' object later when connecting
});

export default socket;