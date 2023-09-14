import React, { createContext, useMemo, useContext } from "react";
import { io } from "socket.io-client";
import{SOCKET_URL} from "../config/urls"
const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

export const SocketProvider = (props) => {
  const socket = useMemo(() => io("localhost:3000"), []);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
