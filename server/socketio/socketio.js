const { Server } = require("socket.io");
const cors = require("cors");


// Export a function to create and configure the Socket.io server
module.exports = function (server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  let rooms = {}

  io.on("connection", (socket) => {
    
    console.log(`user connected ${socket.id}`);

    // Join Chat
    socket.on("join_room", (data) => {
     
    
      socket.join(data.room);
       console.log(data)
  
      socket.to(data.room).emit('user_online',data.user)
      
   
    })

    // update online

    socket.on('update_online',(data)=>{
  
      socket.to(data.room).emit('update_online1',data.user)
    })



      // remove user
      socket.on("remove_user", (data) => {
      
        socket.to(data.room).emit('remove_user1',data.user)
     
      })

      // send message
      socket.on('sent_message',(data)=>{
         console.log("message incom,")
         console.log(data);
        socket.to(data.to).emit('receive_message1',data)
      })

   

   


    //  Disconnect
    socket.on("disconnect", () => {
     
      console.log("A user disconnected");
    });

   



  

  
  

  

 


 
    
  });
};
              