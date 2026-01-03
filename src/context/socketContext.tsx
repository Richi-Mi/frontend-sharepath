//socketCOntext original
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";

//Datos del contexto
interface ISocketContext {
  socket: Socket | null;
  isConnected: boolean;
  userID: string | null;
  username: string | null;
  recargarUsuario: () => void;
}

//Incializacion de datos del contexto
const SocketContext = createContext<ISocketContext>({
  socket: null,
  isConnected: false,
  userID: null,
  username: null,
  recargarUsuario: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userID, setUserID] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const recargarUsuario = () => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");

    if (!token) {
      setUserID(null);
      // setIsConnected(false);
      setUsername(null);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      // console.log("recargarUsuario: No hay token, no se generara socket");
      return;
    }
    // console.log("Ya hay token, generando socket");

    if (storedUser) {
      // console.log("hola desde stored user");
      const datosUsuario = JSON.parse(storedUser);
      setUserID(datosUsuario.correo);
      setUsername(datosUsuario.username);
    } else {
      setUserID(null);
      setUsername(null);
    }
  };

  useEffect(() => {
    recargarUsuario();
  }, []);

  useEffect(() => {
    const handleUserChange = () => {
      recargarUsuario();
    };

    window.addEventListener("storage", handleUserChange);

    return () => window.removeEventListener("storage", handleUserChange);
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  /*Socket cuando cambia el userID*/
  useEffect(() => {
    audioRef.current = new Audio('/audio/nvoMsg.mp3');
    //console.log("Iniciando configuracion de SocketConext...");

    const token = localStorage.getItem("authToken");
    const sessionID = localStorage.getItem("sessionID");

    if (!token) {
      console.log("No se encontró token");
      return;
    }

    const newSocket = io("https://harol-lovers.up.railway.app", {
      //const newSocket = io("https://harol-lovers.up.railway.app", {
      //withCredentials: true,
      path: "/socket.io/",
      autoConnect: false,
      auth: {
        sessionID: sessionID,
        token: token,
      },
    });

    newSocket.connect();
    setSocket(newSocket);
    // newSocket.auth = {
    //     sessionID: sessionID,
    //     token: token
    // };

    // newSocket.on("session", ({ sessionID, userID, username }) => {
    //   console.log(`Evento session - SocketContext: Sesión recibida. ID: ${userID}, Nombre: ${username}, Sesion ID: ${sessionID}`);
    //   newSocket.auth = { sessionID, token };
    //   localStorage.setItem("sessionID", sessionID);
    //   setUserID(userID);
    //   setUsername(username);//Guarda el username en el navegador y estado de react
    // });

    newSocket.on("connect", () => {
      //console.log("SocketContext: Conectado al servidor");
      setIsConnected(true);
    });

    newSocket.on("private message", (message: { content: string; from: string; to: string }) => {
      audioRef.current?.play();

      const fromSelf = message.from === userID; //Mensajes a mi mismo
      // console.warn(fromSelf, typeof fromSelf);
      if(!fromSelf)
      {
        newSocket.emit("mark messages received", { withUserID: message.from });
      }
    });

    newSocket.on("disconnect", () => {
      //console.log("SocketContext: Se perdió la conexión");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error(`SocketContext: Error de conexion ${err.message}`);

      //Si el servidor rechaza el token o el sessionID, se borran para evitar bucles, es decir, se borra sessionID y se asigna una nueva.
      if (
        err.message.includes("inválido") ||
        err.message.includes("No se proporcionó")
      ) {
        console.error("Credenciales inválidas, limpiando sessionID...");
        localStorage.remove("sessionID");
      }
    });

    //console.log("Intentando conectar...");
    newSocket.connect();

    //Guardar el socket en el estado de react
    setSocket(newSocket);
    newSocket.on("session", ({ sessionID, userID, username }) => {
      //console.log("Sesion valida, actualizando datos...");
      localStorage.setItem("sessionID", sessionID);
      newSocket.auth = { sessionID, token };
      setUserID(userID);
      setUsername(username);

      //Pedir amigos aqui
      // console.log("Pidiendo lista de amigos...");
      newSocket.emit("get friends list");
    });

    // newSocket.on("users", (users) => {
    // console.log("Contexto: Recibida lista de amigos: ", users.length);
    // });

    newSocket.on("disconnect", () => setIsConnected(false));
    // newSocket.off("session");
    // newSocket.off("connect");
    // newSocket.off("connect_error");
    // newSocket.off("disconnect");
    //Se pueden poner los .off aqui?

    return () => {
      //console.log("SocketContext: Desconectando usuario...")
      newSocket.off("connect");
      newSocket.off("session");
      newSocket.off("private message");
      newSocket.off("disconnect"), newSocket.disconnect();
    };
  }, [userID]);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, userID, username, recargarUsuario }}
    >
      {children}
    </SocketContext.Provider>
  );
};
