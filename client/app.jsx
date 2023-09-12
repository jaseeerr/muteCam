import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

import Err from "./src/components/user/error";
import Chat from "./src/pages/user/Chat";
import Home from "./src/components/user/Home";
import Call from "./src/components/user/Call";

const UserLayout = ()=>{

    
   

    return(
        <>
      
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <Outlet/>
      </div>
      
      
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
                element:<Home/>

            },
            {
                path:"/talk/:id",
                element:<Chat/>

            },

            {
                path:"/call/:id",
                element:<Call/>

            }
           
            
        ]
        
        
        
    },
    
    
])





const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(<RouterProvider router={AppRouter}/>)