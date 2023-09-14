import React, { useEffect, useCallback, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faFaceSmile, faCameraRetro } from '@fortawesome/free-solid-svg-icons';
import Picker from '@emoji-mart/react'
import ReactPlayer from "react-player";
import peer from "../../services/peer";
import { useSocket } from "../../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const navigate = useNavigate()
  const [streamStatus,setStreamStatus] = useState(false)

  // old
  //states and variabes
  const { id } = useParams()
  const [name, setName] = useState(localStorage.getItem('Uname'))
  const [clear, setClear] = useState(false)
  const [list, setList] = useState([])
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cams, setCams] = useState(true)

  const myVideo = document.createElement('video')
  const videoGrid = document.getElementById('video-grid')
  myVideo.muted = true

  // functions

  const joinRoom = () => {
    localStorage.setItem('Uname', name)

    if (/[^a-zA-Z0-9]/.test(name)) {
      toast.error("Name can only contain alphabets or numbers")
    }
    else {


      socket.emit("room:join", { email: name, room: id });




      setClear(true)
    }

  }

  const sendMessage = () => {
    const data = { from: localStorage.getItem('Uname'), to: id, content: currentMessage, time: Date.now() }
    socket.emit('sent_message', data)
    setMessages((prevMessages) => [...prevMessages, data])
    setShowEmojiPicker(false)
    setCurrentMessage('')
  }



  // useEffects

 

  const messageContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };



  useEffect(() => {
    scrollToBottom(); // Call the scrollToBottom function whenever messages change
  }, [messages]);


  useEffect(() => {

   

    socket.on('receive_message1', (data) => {

      setMessages((prevMessages) => [...prevMessages, data])
    })


  }, [socket])


  // old ends
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    
    
     
    });
  }, []);



  useEffect(() => {
    if(!localStorage.getItem('Uname'))
    {
          navigate('/')
    }
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  useEffect(() => {
    // Add an event listener for the 'beforeunload' event.
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Remove the event listener when the component unmounts.
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleBeforeUnload = () => {
    // Remove the data from localStorage when the page is closed or navigated away.
    localStorage.removeItem('Uname');
  };

  return (
    <>
      <Toaster />

      <div className="flex justify-center items-center   bg-gray-900 text-white">

        <div className="max-w-md w-full flex h-full  flex-col space-y-4">

          {/* People Online */}
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="py-3 px-4">
              <span className='flex justify-evenly cursor-pointer'>
                <h2 onClick={() => navigate('/')} className="text-lg font-semibold mb-2">MuteCams</h2>

              </span>

              <div >
                {/* {remoteSocketId && <button onClick={handleCallUser}>CALL</button>} */}
                {myStream && (
                  <>
                    <span className="flex justify-center">
                    <ReactPlayer
                      playing
                      
                      height="100px"
                      width="200px"
                      url={myStream}
                      
                      style={{ transform: "scaleX(-1)" }}
                    />
                    </span>
                   
                  </>
                )
                }

                {remoteStream && (
                  <>
                   <span className="flex justify-center mt-4">
                    <ReactPlayer
                      playing
                      
                      height="100px"
                      width="200px"
                      url={remoteStream}
                      style={{ transform: "scaleX(-1)" }}
                    />
                    </span>
                  </>
                )}
              </div>


            </div>
          </div>


          <div className="flex justify-center">
            {/* <h1>Room Page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4> */}
      
            {myStream && !streamStatus && <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" onClick={()=>{
              sendStreams()
              setStreamStatus(true)
            }}>Share Cam</button>}
          
            {/* {remoteSocketId && <button onClick={handleCallUser}>CALL</button>} */}


          </div>






          {/* Chat Box */}
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            {/* Chat Header */}
            <div className="bg-gray-700 py-3 px-4 flex justify-between items-center">
              <h1 className="text-lg font-semibold">Chat Room</h1>
              {remoteSocketId && !streamStatus &&
                <button onClick={()=>{
                  handleCallUser()
                  setStreamStatus(true)
                }} className="text-gray-400 hover:text-gray-300">
                  <span className='text-sm font-bold mr-2'>CONNECT</span>
                  <FontAwesomeIcon icon={faCameraRetro} style={{ "--fa-primary-color": "#ffffff", "--fa-secondary-color": "#000000", }} />

                </button>
                
              }

            </div>

            {/* Chat Messages */}
            <div className="px-4 py-3 h-96 overflow-y-auto" ref={messageContainerRef}>
              <div className="flex flex-col space-y-2" >
                <div className="bg-blue-500 rounded-lg p-2 self-start max-w-xs">
                  <p className="text-xs text-gray-400">User 1</p>
                  <div className="break-all">This is a long message that should wrap properly in the chat UI.</div>
                </div>
                <div className="bg-gray-600 rounded-lg p-2 self-end max-w-xs">
                  <p className="text-xs text-gray-400">User 2</p>
                  Short message.
                </div>
                {showEmojiPicker ?
                  ( // Step 3: Conditionally render emoji picker
                    <div className="">
                      <Picker

                        previewPosition="none"
                        onEmojiSelect={(e) => {
                          setCurrentMessage(currentMessage + e.native);
                        }}
                      />
                    </div>
                  )
                  :
                  messages.map((x) => {
                    return (
                      x.from == name ?
                        <div key={x.time + x.from} className="bg-gray-600 rounded-lg p-2 self-end max-w-xs">
                          {/* <p className="text-xs text-gray-400">User 2</p> */}
                          {x.content}
                        </div>
                        :
                        <div key={x.time + x.from} className="bg-blue-500 rounded-lg p-2 self-start max-w-xs">
                          <p className="text-xs text-gray-400">{x.from}</p>
                          <div className="break-all">{x.content}</div>
                        </div>
                    )
                  })}
                {/* More messages here */}
              </div>
            </div>

            {/* Chat Input */}
            <div className="px-4 py-2 flex">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="mr-2 bg-blue-500 hover:bg-blue-600 rounded-full p-2">
                <FontAwesomeIcon icon={faFaceSmile} style={{ color: "#ffffff", }} size='sm' className='px-1' />
              </button>

              {/* Emoji Picker */}
              {/* {showEmojiPicker && ( 
                                    <div className="absolute bottom-72 right-0 mt-2">
                                        <Picker
                                      
                                            previewPosition="none"
                                            onEmojiSelect={(e) => {
                                                setCurrentMessage(currentMessage + e.native);
                                            }}
                                        />
                                    </div>
                                )}  */}

              <input onChange={(e) => setCurrentMessage(e.target.value)} type="text" value={currentMessage} placeholder="Type your message..." className="flex-1 bg-gray-700 text-white rounded-full py-2 px-4 focus:outline-none" />
              {currentMessage.trim().length > 0 ?
                <button onClick={sendMessage} className="ml-2 bg-blue-500 hover:bg-blue-600 rounded-full p-2">
                  <FontAwesomeIcon icon={faPaperPlane} style={{ color: "#ffffff", }} size='sm' className='px-1' />
                </button>
                :
                <button className="ml-2 bg-blue-400  rounded-full p-2">
                  <FontAwesomeIcon icon={faPaperPlane} style={{ color: "#ffffff", }} size='sm' className='px-1' />
                </button>
              }

            </div>
          </div>

        </div>
      </div>




    </>
  );
};

export default RoomPage;
