const express = require('express');
const app = express();
const http = require("http");
const { Server } = require('socket.io');
const cors = require("cors");
const { randomInt } = require('crypto');
const { callbackify } = require('util');

app.use(cors());

//TODO: Consider replacing activeRooms with MongoDB stuff
const activeRooms = {};

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

server.listen(3001, () => {
    console.log("Server is running");
})

io.on("connection", (socket) => {

    socket.on("create_lobby", async (callback) => {
        console.log('\n');
        console.log("create_lobby called\n")

        let roomCode = randomInt(0,9999);
        while (roomCode in activeRooms) {
            roomCode = randomInt(0,9999);
        }

        activeRooms[roomCode] = {
            leader: socket.id,
            users: {}
        };
        
        socket.join(roomCode);

        callback(roomCode);
    });

    socket.on("join_lobby", async (lobbyCode, callback) => {
        console.log('\n');
        console.log("join_lobby called\n");

        if (lobbyCode in activeRooms) {
            //checks if this socket is the leader
            if (socket.id === activeRooms[lobbyCode].leader) {
                socket.emit("setLeader");
            }

            socket.join(lobbyCode);
            
            activeRooms[lobbyCode].users[socket.id] = {
                username: '',
                ready: false
            };
            
            console.log("Sockets in this room: ")
            const roomSockets = await io.in(lobbyCode).fetchSockets();
            for (const currSocket of roomSockets) {
                console.log("Socket ID: ", currSocket.id);
            };

            callback(true);
        } else {
            callback(false);
        }
    });

    //TODO: Make name checking work (currently modal still closes on client side)
    socket.on("set_name", (socketName, lobbyCode) => {
        console.log('\n');
        console.log("set_name called\n");
        let validName = true;
        
        //Check if name currently in room
        for (const user in activeRooms[lobbyCode].users) {
            if ("username" in activeRooms[lobbyCode].users[user] && activeRooms[lobbyCode].users[user].username === socketName) {
                console.log("Name false");
                validName = false;
            }
        }

        if (!validName) {
            socket.emit("closeNameModal", false)
            return;
        }

        socket.emit("closeNameModal", true);

        activeRooms[lobbyCode].users[socket.id].username = socketName;

        console.log("Active Room Users", activeRooms[lobbyCode].users);

        io.to(lobbyCode).emit('update_users', activeRooms[lobbyCode].users);
        
        // callback(validName);
    });

    socket.on("ready", (lobbyCode) => {
        activeRooms[lobbyCode].users[socket.id].ready = !(activeRooms[lobbyCode].users[socket.id].ready);
        // callback(activeRooms[lobbyCode].users);
        io.to(lobbyCode).emit('update_users', activeRooms[lobbyCode].users);
    })

    //Checks that all sockets are ready for game start
    socket.on("startGame", (lobbyCode) => {
        console.log("startGame called");
        let allPlayersReady = true;

        for (const user in activeRooms[lobbyCode].users) {
            console.log("User being checked:", user);
            if (!(activeRooms[lobbyCode].users[socket.id].ready)) {
                allPlayersReady = false;
            }
        }

        io.to(lobbyCode).emit("clientStartGame", allPlayersReady, lobbyCode);
    })

    socket.on("joinGame", (lobbyCode, callback) => {
        console.log("joinGame called");

        if ((!lobbyCode in activeRooms) || (!activeRooms[lobbyCode].users) || (!socket.id in activeRooms[lobbyCode].users)) {
            callback(true);
        }

        callback(false);
    })

    //TODO: Add room closing and being removed from activeRooms map when leader leaves
    //TODO: Handle the case where the server crashes when somebody leaves
    //Handles what happens under disconnect
    socket.on("disconnecting", () => {
        console.log('\n');
        console.log("Active Rooms pre-disconnect: ", activeRooms);
        console.log("Socket Rooms open pre-disconnect: ", socket.rooms);
        
        let lobbyCode = Array.from(socket.rooms)[1];

        //Checks if the active room exists first
        if (activeRooms[lobbyCode]) {
            //If the leader leaves, shut down the room and remove everybody from the room and the activeRooms Object
            if (socket.id === activeRooms[lobbyCode].leader) {
                io.to(lobbyCode).emit("leave_room");
                io.in(lobbyCode).socketsLeave(lobbyCode); //Remove all sockets in the room       
                delete activeRooms[lobbyCode]; //Removes the room from the list
            } else {
                delete activeRooms[lobbyCode].users[socket.id]; //Remove the user from object
                socket.leave(lobbyCode); //Remove the user from the room
                io.to(lobbyCode).emit('update_users', activeRooms[lobbyCode].users); //Updates visible users in the room
            }
        }
        
        console.log("Socket Rooms open post-disconnect: ", socket.rooms);
        console.log("Active Rooms post-disconnect: ", activeRooms);
    });
});