import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      room.length > 0 && room.length < 10 &&  socket.emit("room:join", { email, room });

     
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      localStorage.setItem('Uname',email)
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  const [clear,setClear] = useState(false)
  const validate = (text)=>{
    if (text.length>2) 
    {
          setClear(true)
    }
    else
    {
      setClear(false)
    }

  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
  <h1 className="text-3xl font-bold mb-4">Lobby</h1>
  <form className="flex flex-col space-y-4" onSubmit={handleSubmitForm}>
    <div className="flex flex-col">
      <label htmlFor="email" className="text-lg mb-1">Name</label>
      <input
        type="text"
        id="email"
        
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          e.target.value.length > 2 && e.target.value.length < 10 ? setClear(true) : setClear(false)

        }}
        className="border text-black border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
      />
    </div>
    <div className="flex flex-col">
      <label htmlFor="room" className="text-lg mb-1">Room Number</label>
      <input
        type="text"
        id="room"
        value={room}
        onChange={(e) =>{
          setRoom(e.target.value)
          e.target.value.length > 0 && e.target.value.length < 10 ? setClear(true) : setClear(false)
        }}
        className="border text-black border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
      />
    </div>
    {clear ?
     <button
     type="submit"
     className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
   >
     Join
   </button>
   :
   <button
  
   className="bg-blue-400  text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
 >
   Join
 </button>
  }
   
  </form>
</div>

  
  );
};

export default LobbyScreen;
