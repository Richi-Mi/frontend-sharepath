// ChatLayout original
"use client";

import * as React from "react";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Conversation, Message, User } from "./_types";
import { ChatsSidebar } from "./ChatsSidebar";
import { ChatThread } from "./ChatThread";
import { ChatDetails } from "./ChatDetails";
import { useSocket } from "@/context/socketContext"; //
// import { m } from "react-motion";
//import { currentUser } from "./_mock"; //

//Datos que se reciben del servidor
type SocketUser = {
  userID: string;
  username: string;
  foto_url?: string;
  connected: boolean;
  messages: any[];
  hasNewMessages?: boolean;
  lastMessage?: string;
  lastMessageHora?: string;
  unreadCount: number;
};

//Funciones auxiliar para adaptar datos del socket al front
function adaptSocketMessageToUIMessage(socketMsg: any, selfUserID: string): Message {
  const isMine = socketMsg.from === selfUserID;

  let statusUI = "sent";
  if (socketMsg.status === 1) statusUI = "received";
  else if (socketMsg.status === 2) statusUI = "read";

  return {
    id: socketMsg.id || crypto.randomUUID(),
    authorId: socketMsg.from,
    text: socketMsg.content,
    createdAt: socketMsg.createdAt || new Date().toISOString(),
    status: isMine ? statusUI : undefined,
  };
}

function adaptSocketUserToConversation(user: SocketUser, selfUser: User): Conversation {
  const uiMessages: Message[] = user.messages.map((msg) =>
    adaptSocketMessageToUIMessage(msg, selfUser.id)
  );

  let unreadValue = 0;

  if(user.unreadCount && user.unreadCount > 0)
  {
    unreadValue = user.unreadCount;
  }
  else if(user.hasNewMessages)
  {
    unreadValue = 1;//Si llega en tiempo real
  }

  return {
    id: user.userID,
    title: user.username,
    members: [selfUser, { id: user.userID, name: user.username, online: user.connected, foto_url: user.foto_url }],
    messages: uiMessages,
    lastMessage: user.lastMessage,
    lastMessageHora: user.lastMessageHora,
    unread: unreadValue,//Mensajes sin leer
    tripId: undefined,
  };
}
//////

export function ChatLayout() {
  const { socket, userID, username, recargarUsuario } = useSocket();

  React.useEffect(() => {
    if(!userID){
      // console.log("userID: ", userID);
      recargarUsuario();
    }
  }, [userID, recargarUsuario])

  // console.log("DEBUG CHAT LAYOUT:", { 
  //     userID, 
  //     username, 
  //     socketConectado: !!socket 
  // });

  const [socketUsers, setSocketUsers] = React.useState<SocketUser[]>([]);
  const [activeId, setActiveId] = React.useState<string | undefined>(undefined);
  const [loadingFriends, setLoadingFriends] = React.useState(true);

  const activeIdRef = useRef<string | undefined>(undefined); //Para acceder al chat del amigo

  // const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { activeIdRef.current = activeId }, [activeId]);

  React.useEffect(() => {
    // audioRef.current = new Audio('/audio/nvoMsg.mp3');

    if (!socket || !userID || !username) {
        // console.log("ChatLayout: Esperando username socket y userID... Socket no listo");
        return;
    }

  const timer = setTimeout(() => {
        // console.log("Forzando actualización de lista...");
        
        if (socket.connected && userID) {
            //Intento 1: Pedir lista
            socket.emit("get friends list", { userID });
        } else {
            //Intento 2: Si no conecta, forzar reconexion
            socket.disconnect();
            socket.connect();
        }
    }, 500); //medio segundo de retraso

    // clearTimeout(timera);
    
    const requestFriendList = () => {
      setTimeout(() => {
        // console.log("Conetado, solicitando amigos...");
        socket.emit("get friends list");
      }, 500)
    };

    if(socket.connected) requestFriendList();

    socket.on("connect", requestFriendList);

    // console.log("ChatLayout: Socket y userID listos. Configurando listeners...");

    socket.on("users", (users: SocketUser[]) => {
      // console.log("ChatLayout: Recibido evento 'users'");
      setLoadingFriends(false);

      setSocketUsers((currentUsers) => {
        const currentUsersMap = new Map(currentUsers.map(u => [u.userID, u]));

        return users.map(newUser => {
          const existingUser = currentUsersMap.get(newUser.userID);

          return{
            ...newUser,
            //Si ya habia mensajes guardados, se mantienen, sino array vacio
            messages: existingUser ? existingUser.messages : [],
            hasNewMessages: existingUser ? existingUser.hasNewMessages : false,
            unreadCount: existingUser ? existingUser.unreadCount : (newUser.unreadCount || 0),
            //foto_url: existingUser ? existingUser.foto_url : (newUser.foto_url || ""),
            //lastMessage: existingUser ? existingUser.lastMessage : (newUser.lastMessage || ""), //Creo que estos se pueden comentarizar porque el nuevo mensaje con hora y texto se muestran
            //lastMessageHora: existingUser ? existingUser.lastMessageHora : (newUser.lastMessageHora || ""), //cuando envio (sendMessage - setSocketUser) y cuando recibo uno (private message)
          };
        });
      });
      
      // if (allUsers.length > 0 && !activeId) {
      //   setActiveId(allUsers[0].userID);
      // }
    });

    socket.on("user connected", (user: SocketUser) => {
      // console.log("ChatLayout: Recibido evento 'user connected'", user);
      // console.log(`Evento recibido: ${user.userID} se conecto.`);
      setSocketUsers((prev) => {
        const exists = prev.find(u => u.userID === user.userID);
        if(exists)
        {
          return prev.map((u) => u.userID === user.userID ? { ...u, connected: true } : u)
        }
        else
        {
          //Si es nuevo, se agrega
          return [...prev, { ...user, connected: true, messages: [], hasNewMessages: false }];
        }
      });
    });

    socket.on("user disconnected", (disconnectedID: string) => {
      // console.log(`${disconnectedID} desconectado`);
      // console.log(`Evento recibido: Usuario ${disconnectedID} se desconecto.`);
      
      setSocketUsers((prev) => {
        return prev.map((u) => {
          if (u.userID === disconnectedID) {
              // console.log(`Desconectando a: ${u.username}`);
              return { ...u, connected: false };
          } else {
              return u;
          }
        });
      });
    });

    socket.on("chat history", ({ withUserID, messages }) => {
      // console.log('Chat history');
      setSocketUsers((prev) => prev.map((u) => {
        if(u.userID === withUserID)
        {
          return { ...u, messages: messages }; //Se guardan los mensajes en el estado
        }
        return u;
      }));
    });

    const nuevoMensaje = (message: { content: string; from: string; to: string }) => {
        const currentActiveId = activeIdRef.current;
        
        const fromSelf = message.from === userID; //Mensajes a mi mismo
        // const targetUserID = fromSelf ? message.to : message.from; //el target es el remitente (from)
        const isChatOpen = activeIdRef.current === message.from; //El chat esta abierto?

        if(!fromSelf && isChatOpen)
        {
          socket.emit("mark messages read", { withUserID: message.from });
        }

        // if(!fromSelf)
        // {
        //   socket.emit("mark messages received", { withUserID: message.from });
        // }

        setSocketUsers((prev) => {
          const senderUser = prev.find((u) => u.userID === message.from);

          if(!senderUser) return prev;

          const updatedUser = {
            ...senderUser,
            messages: [...senderUser.messages, message],
            hasNewMessages: !isChatOpen,
            // unreadCount: u.userID !== activeId ? (u.unreadCount + 1) : 0,
            unreadCount: isChatOpen ? 0 : ((senderUser.unreadCount || 0) + 1),
            lastMessage: message.content,
            lastMessageHora: new Date().toISOString(),
          };

          const otherUsers = prev.filter((u) => u.userID !== message.from);

          return [updatedUser, ...otherUsers];
        });
    }

    socket.on("private message", nuevoMensaje);
    // socket.on("private message", (message: { content: string; from: string; to: string }) => {
    //     // console.log("ChatLayout: Recibido evento 'private message'", message);

    //     //audioRef.current?.play()
    //     // audioRef.current?.play().catch((error) => {
    //     //   console.warn("El navegador bloqueo el sonido por falta de interacción", error)
    //     // });

    //     const currentActiveId = activeIdRef.current;
        
    //     const fromSelf = message.from === userID; //Mensajes a mi mismo
    //     // const targetUserID = fromSelf ? message.to : message.from; //el target es el remitente (from)
    //     const isChatOpen = activeIdRef.current === message.from; //El chat esta abierto?

    //     if(!fromSelf && isChatOpen)
    //     {
    //       socket.emit("mark messages read", { withUserID: message.from });
    //     }

    //     // if(!fromSelf)
    //     // {
    //     //   socket.emit("mark messages received", { withUserID: message.from });
    //     // }

    //     setSocketUsers((prev) => {
    //       const senderUser = prev.find((u) => u.userID === message.from);

    //       if(!senderUser) return prev;

    //       const updatedUser = {
    //         ...senderUser,
    //         messages: [...senderUser.messages, message],
    //         hasNewMessages: !isChatOpen,
    //         // unreadCount: u.userID !== activeId ? (u.unreadCount + 1) : 0,
    //         unreadCount: isChatOpen ? 0 : ((senderUser.unreadCount || 0) + 1),
    //         lastMessage: message.content,
    //         lastMessageHora: new Date().toISOString(),
    //       };

    //       const otherUsers = prev.filter((u) => u.userID !== message.from);

    //       return [updatedUser, ...otherUsers];
    //     });

    //     // setSocketUsers((prev) =>
    //     //   prev.map((u) => {
    //     //     const fromSelf = message.from === userID;
    //     //     const targetUserID = fromSelf ? message.to : message.from;
    //     //     const isChatOpen = activeIdRef.current === targetUserID;

    //     //     if (u.userID === targetUserID) {
    //     //       //Si el chat esta abierto y recibo un mensaje, se marca como leido
    //     //       if(!fromSelf && isChatOpen)
    //     //       {
    //     //         socket.emit("mark messages read", { withUserID: targetUserID });
    //     //       }

    //     //       if(!fromSelf)
    //     //       {
    //     //        socket.emit("mark messages received", { withUserID: targetUserID });
    //     //       }

    //     //       return {
    //     //         ...u,
    //     //         messages: [...u.messages, message], //Se agrega el array existente
    //     //         // hasNewMessages: u.userID !== activeId,
    //     //         hasNewMessages: !isChatOpen,
    //     //         // unreadCount: u.userID !== activeId ? (u.unreadCount + 1) : 0,
    //     //         unreadCount: isChatOpen ? 0 : (u.unreadCount + 1),

    //     //         lastMessage: message.content,
    //     //         lastMessageHora: new Date().toISOString(),
    //     //       };
    //     //     }
    //     //     return u;
    //     //   })
    //     // );
    //   }
    // );

    socket.on("messages read", ({ byUserID }) => {
      // console.log('Mensaje Evento messages read');
      setSocketUsers((prev) => prev.map((u) => {
        if(u.userID === byUserID){
          //Actualizar status de mis mensajes enviados a este usuario
          const updatedMessages = u.messages.map(m => 
            m.from === userID ? { ...m, status: 2 } : m
          );

          return { ...u, messages: updatedMessages };
        }
        return u;
      }));
    });

    socket.on("message received", ({ byUserID }) => {
      // console.log('Evento mensaje received');
      setSocketUsers((prev) => prev.map((u) => {

        if(u.userID === byUserID)
        {
          const updatedMessages = u.messages.map(m => 
            (m.from === userID && (!m.status || m.status < 1)) ? { ...m, status: 1 } : m
          );
          return { ...u, messages: updatedMessages }
        }

        return u;
      }));
    });

    return () => {
      clearTimeout(timer);
      // console.log("ChatLayout: Limpiando listeners de socket");
      socket.off("connect");
      socket.off("users");
      socket.off("user connected");
      socket.off("user disconnected");
      socket.off("chat history");
      socket.off("private message", nuevoMensaje);
      socket.off("messages read");
      socket.off("message received");
    };
  }, [socket, userID, username, loadingFriends]);

  const selfUser: User | null = React.useMemo(() => {
    if (!userID || !username) return null;
    return {
        id: userID,
        name: username,
        avatar: "", //foto_url para el contexto del socket
        online: true,
    };
  }, [userID, username]);

  const conversationsForUI: Conversation[] = React.useMemo(() => {
    // console.log("debug usuario:", { userID, username, socket: !!socket });
    if (!selfUser) return []; //Si aun no sabemos quienes somos, no muestra nada
    //Pasa 'selfUser' a la funcion que adapta los sockets al front
    return socketUsers.map((u) => adaptSocketUserToConversation(u, selfUser));
  }, [socketUsers, selfUser]);

  const active = conversationsForUI.find((c) => c.id === activeId);

  function sendMessage(text: string) {
    if (!active || !socket || !userID) return; //userID del contexto del socket
    
    // console.log(`ChatLayout: Enviando mensaje a ${active.id}`);
    socket.emit("private message", {
      content: text,
      to: active.id,
    });

    const socketMsg = {
      content: text,
      from: userID, //userID del contexto
      to: active.id,
      createdAt: new Date().toISOString(),
      status: 0 //Enviado
    };

  setSocketUsers((prev) => {
    const userToMove = prev.find((u) => u.userID === active.id);

    if (!userToMove) return prev; 

    const updatedUser = {
      ...userToMove,
      messages: [...userToMove.messages, socketMsg],
      lastMessage: text,
      lastMessageHora: new Date().toISOString()
    };

    const otherUsers = prev.filter((u) => u.userID !== active.id);

    return [updatedUser, ...otherUsers];
  });


    // setSocketUsers((prev) =>
    //   prev.map((u) =>
    //     u.userID === active.id
    //       ? { ...u, messages: [...u.messages, socketMsg], lastMessage: text, lastMessageHora: new Date().toISOString() }
    //       : u
    // ))
  }
  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setSocketUsers((prev) =>
      prev.map((u) =>
        u.userID === id ? { ...u, hasNewMessages: false, unreadCount: 0 } : u
      )
    );

    if(socket){
      //Pedir historial de mensajes
      socket.emit("fetch messages", { withUserID: id });

      //Marcar como leidos
      socket.emit("mark messages read", { withUserID: id});
    }
  };

  const [showDetails, setShowDetails] = React.useState(true);

if (!selfUser) {
      return (
          <div className="h-full grid place-content-center text-center text-muted-foreground">
              Cargando datos de usuario...
          </div>
      );
  }

return (
  <div className="grid grid-cols-[1fr_2fr] gap-2 h-full bg-white dark:bg-[#0b141a] transition-colors overflow-hidden">
      {/* Barra lateral de Chats (contactos) */}
      <aside className="border-r border-gray-200 dark:border-gray-700 h-full overflow-hidden">
        {
          // active &&
          <ChatsSidebar
            conversations={conversationsForUI}
            activeId={activeId}
            onSelect={handleSelectConversation}
            //selfUserId={selfUser.id}
          ></ChatsSidebar>
        }
      </aside>
      {/* <aside className="border-r bg-card/50 overflow-hidden">
        <ChatsSidebar
          conversations={conversationsForUI}
          activeId={activeId}
          onSelect={handleSelectConversation}
        />
      </aside> */}

      {/* Chat activo */}
      <main className="min-w-0">
        {active ? (
          <ChatThread
            conversation={active}
            onSend={sendMessage}
            onToggleDetails={() => setShowDetails((v) => !v)}
            selfUserId={selfUser.id}
          />
        ) : (
          <div className="h-full grid place-content-center text-center text-muted-foreground">
            {/* {socketUsers.length > 0
              ? "Selecciona una conversación"
              : "No tienes amigos en tu lista"} */}
            {loadingFriends ? (
              "Cargando amigos..."
            ) : socketUsers.length === 0 ? (
              "No tienes amigos en tu lista"
            ) : (
              "Selecciona una conversación"
            )}
          </div>
        )}
      </main>

      {/* Detalles del contacto */}
      {/* <aside className={cn("border-l bg-card/40", showDetails ? "block" : "hidden md:block")}>
        {active && <ChatDetails conversation={active} />}
      </aside> */}
  </div>
  );
}


//LO DE JULIO
// "use client";

// import * as React from "react";
// import { cn } from "@/lib/utils";
// import { Conversation, Message } from "./_types";
// import { ChatsSidebar } from "./ChatsSidebar";
// import { ChatThread } from "./ChatThread";
// import { ChatDetails } from "./ChatDetails";
// import { currentUser } from "./_mock";

// export function ChatLayout({
//   conversations,
//   onUpdateConversation,
// }: {
//   conversations: Conversation[];
//   onUpdateConversation: (id: string, updater: (c: Conversation) => Conversation) => void;
// }) {
//   const [activeId, setActiveId] = React.useState(conversations[0]?.id);
//   const active = conversations.find((c) => c.id === activeId);

//   function sendMessage(text: string) {
//     if (!active) return;
//     const msg: Message = {
//       id: crypto.randomUUID(),
//       authorId: currentUser.id,
//       text,
//       createdAt: new Date().toISOString(),
//       status: "sent",
//     };
//     onUpdateConversation(active.id, (c) => ({
//       ...c,
//       messages: [...c.messages, msg],
//       lastMessage: msg,
//       unread: 0,
//     }));
//   }

//   const [showDetails, setShowDetails] = React.useState(true);

//   return (
//     <div
//       className={cn(
//         "grid h-[calc(100dvh-64px)]",
//         "grid-cols-1 md:grid-cols-[minmax(280px,360px)_minmax(0,1fr)_minmax(280px,360px)]"
//       )}
//     >
//       {/* Sidebar conversaciones */}
//       <aside className="border-r bg-card/50 overflow-hidden">
//         <ChatsSidebar
//           conversations={conversations}
//           activeId={activeId}
//           onSelect={setActiveId}
//         />
//       </aside>

//       {/* Thread */}
//       <main className="min-w-0">
//         {active ? (
//           <ChatThread
//             conversation={active}
//             onSend={sendMessage}
//             onToggleDetails={() => setShowDetails((v) => !v)}
//           />
//         ) : (
//           <div className="h-full grid place-content-center text-center text-muted-foreground">
//             Selecciona una conversación
//           </div>
//         )}
//       </main>

//       {/* Detalles */}
//       <aside className={cn("border-l bg-card/40", showDetails ? "block" : "hidden md:block")}>
//         {active && <ChatDetails conversation={active} />}
//       </aside>
//     </div>
//   );
// }
