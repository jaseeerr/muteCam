import React, { useEffect, useState, useRef,useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast'
import { SOCKET_URL } from '../../config/urls';
import io from 'socket.io-client'
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faFaceSmile, faCameraRetro } from '@fortawesome/free-solid-svg-icons';
import Picker from '@emoji-mart/react'
import ReactPlayer from "react-player"
import peer from "../../services/peer";

import ScrollToBottom from "react-scroll-to-bottom"
import Cam from "./Cam"
// import peer from '../../services/peer';
const socket = io.connect(SOCKET_URL)

const Chat = () => {



    //states and variabes
    const goto = useNavigate()
    const { id } = useParams()
    const [name, setName] = useState("")
    const [clear, setClear] = useState(false)
    const [list, setList] = useState([])
    const [messages, setMessages] = useState([])
    const [currentMessage, setCurrentMessage] = useState('')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [cams,setCams] = useState(true)

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


            socket.emit("room:join", { email:name, room:id });

          

            
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

    const handleCall = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
        const offer = await peer.getOffer()
        setMyStream(stream)
    }

    // useEffects

    useEffect(() => {
        const beforeUnloadListener = (event) => {
            const x = localStorage.getItem('Uname')
            socket.emit('remove_user', { room: id, user: x })


        }
        window.addEventListener('beforeunload', beforeUnloadListener)
        return () => {
            localStorage.removeItem('Uname')
            window.removeEventListener('beforeunload', beforeUnloadListener)

        };
    }, [id])

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

        socket.on('user_online', (data) => {

            setList((prevList) => {
                if (!prevList.includes(data)) {
                    return [...prevList, data];
                }
                return prevList;
            });

            socket.emit('update_online', { room: id, user: localStorage.getItem('Uname') })
        })

        socket.on('update_online1', (data) => {


            setList((prevList) => {
                if (!prevList.includes(data)) {
                    return [...prevList, data];
                }
                return prevList;
            });

        })

        socket.on('remove_user1', (data) => {

            setList((prevList) => {
                if (prevList.includes(data)) {
                    return prevList.filter(user => user !== data);
                }
            });


        })

        socket.on('receive_message1', (data) => {

            setMessages((prevMessages) => [...prevMessages, data])
        })


    }, [socket])





    // for cam
    const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handleUserJoined = useCallback(({ name, id }) => {
    console.log(`Email ${name} joined room`);
   

    // setTimeout(()=>{
    //     handleCallUser()
    // },500)
  
    
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    setCams(true)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      let stream
      try {
         stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
      } catch (error) {
        console.log(error)
        console.log("err from point")
      }
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
      console.log(remoteStream)
    });
  }, []);

 
  

  useEffect(() => {
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
    // for cam ends
    return (

        <>
            <Toaster />
            {clear ?
                <div className="flex justify-center items-center   bg-gray-900 text-white">

                    <div className="max-w-md w-full flex h-full  flex-col space-y-4">

                        {/* People Online */}
                        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                            <div className="py-3 px-4">
                                <span className='flex justify-evenly cursor-pointer'>
                                <h2 onClick={()=>setCams(false)} className="text-lg font-semibold mb-2">People Online</h2>
                                <h2 onClick={()=>setCams(true)} className="text-lg font-semibold mb-2">MuteCams</h2>

                                </span>
                                {cams ? 
                               <div className='flex'>
                                 {/* {remoteSocketId && <button onClick={handleCallUser}>CALL</button>} */}
  {myStream && (
        <>
          
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={myStream}
          />
        </>
      )
  }

      {remoteStream && (
        <>
         
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={remoteStream}
          />
        </>
      )}
                               </div>
                             :
                             <ul className="space-y-2 max-h-32 overflow-y-auto">
                             {list.length > 0 && list.map((x) => {
                                 return (
                                     <li key={x} className="flex items-center">
                                         <div className="bg-green-500 rounded-full h-3 w-3 mr-2"></div>
                                         <span>{x}</span>
                                     </li>
                                 )
                             })}

                             {/* More online users here */}
                         </ul>
                             }
                               
                            </div>
                        </div>


                        <div>
      {/* <h1>Room Page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4> */}
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      <br />
      {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
      
    
    </div>

                       




                        {/* Chat Box */}
                        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                            {/* Chat Header */}
                            <div className="bg-gray-700 py-3 px-4 flex justify-between items-center">
                                <h1 className="text-lg font-semibold">Chat Room</h1>
                                {remoteSocketId && 
                                    <button onClick={handleCallUser} className="text-gray-400 hover:text-gray-300">
                                        <span className='text-sm font-bold mr-2'>CONNECT</span>
                                    <FontAwesomeIcon icon={faCameraRetro} style={{"--fa-primary-color": "#ffffff", "--fa-secondary-color": "#000000",}} />
                                     
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
                :


                <div className="fixed inset-0 bg-gray-900 bg-opacity-100 flex items-center justify-center" >
                    <div className="bg-black p-8 rounded-lg w-80">
                        <h2 className="text-xl font-semibold mb-2 text-white">Enter a name</h2>

                        <div className="flex mb-3" >
                            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                                <svg className="w-4 h-4 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                                </svg>
                            </span>
                            <input onChange={(e) => setName(e.target.value)} type="text" id="website-admin" className="rounded-none rounded-r-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Name" />

                        </div>
                        <div className='flex justify-center'>
                            {name.length >= 3 ?
                                <button onClick={joinRoom} className="mt-4 mr-3 bg-blue-500 text-white px-2 py-1 rounded-lg text-sm ">

                                    Join Room
                                </button>
                                :
                                <button className="mt-4 mr-3 bg-blue-400 text-white px-2 py-1 rounded-lg text-sm">

                                    Join Room
                                </button>
                            }
                        </div>




                        {/* <button className="mt-4 bg-blue-500 text-white px-2 py-1 rounded-lg text-sm">
    Close
  </button>  */}
                    </div>

                </div>
            }



        </>

    );
};

export default Chat;
