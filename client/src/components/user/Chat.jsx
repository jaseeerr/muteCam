import React, { useEffect, useState, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast'
import { SOCKET_URL } from '../../config/urls';
import io from 'socket.io-client'
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faFaceSmile, faPhone } from '@fortawesome/free-solid-svg-icons';
import Picker from '@emoji-mart/react'
import ReactPlayer from "react-player"
import ScrollToBottom from "react-scroll-to-bottom"
import peer from '../../services/peer';
const socket = io.connect(SOCKET_URL)
const img = "https://th.bing.com/th/id/OIG.lVXjWwlHyIo4QdjnC1YE"
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
    const [myStream, setMyStream] = useState(null)
    const messagesEndRef = useRef(null);
    // functions
    const joinRoom = () => {
        localStorage.setItem('Uname', name)

        if (/[^a-zA-Z0-9]/.test(name)) {
            toast.error("Name can only contain alphabets or numbers")
        }
        else {

            socket.emit("join_room", { room: id, user: name })
            // setList((prevList) => [...prevList, name]);
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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
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

    return (

        <>
            <Toaster />
            {clear ?
                <div className="flex justify-center items-center min-h-screen overflow-y-auto bg-gray-900 text-white">

                    <div className="max-w-md w-full flex h-screen  flex-col space-y-4">

                        {/* People Online */}
                        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                            <div className="py-3 px-4">
                                <h2 className="text-lg font-semibold mb-2">People Online</h2>
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
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
    <div className="py-3 px-4">
        <h2 className="text-lg font-semibold mb-2">Image Carousel</h2>
        <div className="max-h-32 overflow-x-auto">
            <div className="flex space-x-2">
                {/* Add your image items here */}
                <div className="w-64 h-32 flex-shrink-0">
                    <img src={img} alt="Image 1" className="w-full h-full object-cover" />
                </div>
                <div className="w-64 h-32 flex-shrink-0">
                    <img src={img} alt="Image 2" className="w-full h-full object-cover" />
                </div>
                <div className="w-64 h-32 flex-shrink-0">
                    <img src={img} alt="Image 3" className="w-full h-full object-cover" />
                </div>
                {/* Add more image items here */}
            </div>
        </div>
    </div>
</div>




                        {/* Chat Box */}
                        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                            {/* Chat Header */}
                            <div className="bg-gray-700 py-3 px-4 flex justify-between items-center">
                                <h1 className="text-lg font-semibold">Chat Room</h1>
                                <button className="text-gray-400 hover:text-gray-300">
                                    <FontAwesomeIcon icon={faPhone} style={{ color: "#ffffff", }} />
                                </button>
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
