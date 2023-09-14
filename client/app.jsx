import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { SocketProvider } from "./src/context/SocketProvider";

import Err from "./src/components/user/error";
import LobbyScreen from "./src/components/user/Lobby"
import RoomPage from "./src/components/user/Room";
const UserLayout = ()=>{

    
   

    return(
        <>
       <SocketProvider>
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <Outlet/>
      </div>
      </SocketProvider>
      
        </>
    )
}





const AppRouter = createBrowserRouter([
    {
        path:"/",
        element:<UserLayout/>,
        errorElement:<Err/>,
        children:[
            {
                path:"/",
                element:<LobbyScreen/>

            },
            {
                path:"/room/:id",
                element:<RoomPage/>

            },

            
           
            
        ]
        
        
        
    },
    
    
])





const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(<RouterProvider router={AppRouter}/>)