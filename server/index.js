const express = require('express');
const app = express();
const http = require("http");
const { Server } = require('socket.io');
const cors = require("cors");
const { randomInt } = require('crypto');
const { callbackify } = require('util');
const connectDB = require('./connectMongo');
const Role = require('./Role');

require('dotenv').config();

app.use(cors());

//TODO: Consider replacing activeRooms with MongoDB stuff
const activeRooms = {};

connectDB();

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
            users: {},
            numberOfPlayers: 0,
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

        //Increment numberOfPlayers
        activeRooms[lobbyCode].numberOfPlayers += 1

        console.log("Active Room Users", activeRooms[lobbyCode].users);

        io.to(lobbyCode).emit('update_users', activeRooms[lobbyCode]);

        console.log("Post set_name roomObj: ", activeRooms[lobbyCode]);
        
        // callback(validName);
    });

    socket.on("ready", (lobbyCode) => {
        activeRooms[lobbyCode].users[socket.id].ready = !(activeRooms[lobbyCode].users[socket.id].ready);
        // callback(activeRooms[lobbyCode].users);
        io.to(lobbyCode).emit('update_users', activeRooms[lobbyCode]);
    })

    //Checks that all sockets are ready for game start
    socket.on("startGame", async (lobbyCode) => {
        console.log("startGame called");
        let allPlayersReady = true;

        let roleList = ["President", "Bomber"];
        numberOfRolesToAdd = activeRooms[lobbyCode].numberOfPlayers - 2;

        //If odd numberOfPlayers, add gambler
        if (activeRooms[lobbyCode].numberOfPlayers % 2 > 0) {
            roleList.push("Gambler");
            numberOfRolesToAdd = numberOfRolesToAdd - 1;
        }

        for (const user in activeRooms[lobbyCode].users) {
            console.log("User being checked:", user);

            //If there are less than 6 players, can't start the game
            if (activeRooms[lobbyCode].numberOfPlayers < 2) {
                allPlayersReady = false;
                break;
            }

            //If the user has a set username and is not ready, the game does NOT start
            if ("username" in activeRooms[lobbyCode].users[user] && !(activeRooms[lobbyCode].users[user].ready)) {
                allPlayersReady = false;
                break;
            }

        }

        //If everyone is ready and there are more than 6 players
        if (allPlayersReady) {
            
            let addRed = true;
            
            //Fill out with Red and Blue Team
            for (let i=0; i<numberOfRolesToAdd; i++) {
                if (addRed) {
                    roleList.push("Red Team");
                } else {
                    roleList.push("Blue Team");
                }

                addRed = !addRed;
            }

            randomNumSet = new Set();

            for (const user in activeRooms[lobbyCode].users) {
                let randomIndex = Math.floor(Math.random() * (roleList.length));

                //Makes sure randomIndex hasn't been assigned yet
                while (randomNumSet.has(randomIndex)) {
                    randomIndex = Math.floor(Math.random() * (roleList.length));
                }
                
                //TODO: Search MongoDB and emit that back as object
                // Role.findOne({roleName: roleList[randomIndex]}, (err, role) => {
                //     io.to(user).emit("setRole", role.toObject());
                // })
                let roleObject = await Role.findOne({roleName: roleList[randomIndex]});
                io.to(user).emit("setRole", roleObject.toObject());

                // io.to(user).emit("setRole", roleList[randomIndex]);

                randomNumSet.add(randomIndex);

            }



            // for (let i=0; i<roleList.length; i++) {
            //     let randomIndex = Math.floor(Math.random() * (roleList.length));

            //     //Makes sure randomIndex hasn't been assigned yet
            //     while (randomNumSet.has(randomIndex)) {
            //         randomIndex = Math.floor(Math.random() * (roleList.length));
            //     }


            // }
        }

        io.to(lobbyCode).emit("clientStartGame", allPlayersReady, lobbyCode);
    })

    socket.on("joinGame", (lobbyCode, callback) => {
        console.log("joinGame called");

        //TODO: Edit so that this doesn't cause the server to crash
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
        if (lobbyCode in activeRooms) {

            //If the leader leaves, shut down the room and remove everybody from the room and the activeRooms Object
            if (socket.id === activeRooms[lobbyCode].leader) {
                io.to(lobbyCode).emit("leave_room");
                io.in(lobbyCode).socketsLeave(lobbyCode); //Remove all sockets in the room       
                delete activeRooms[lobbyCode]; //Removes the room from the list

                
            } else {

                //If the given socket is a member of users in the room (is named and visible)
                if (socket.id in activeRooms[lobbyCode].users && "username" in activeRooms[lobbyCode].users[socket.id]) {
                    activeRooms[lobbyCode].numberOfPlayers = activeRooms[lobbyCode].numberOfPlayers - 1; //decrements number of players by 1
                }

                delete activeRooms[lobbyCode].users[socket.id]; //Remove the user from object
                socket.leave(lobbyCode); //Remove the user from the room
                io.to(lobbyCode).emit('update_users', activeRooms[lobbyCode]); //Updates visible users in the room
            } 
        }
        
        console.log("Socket Rooms open post-disconnect: ", socket.rooms);
        console.log("Active Rooms post-disconnect: ", activeRooms);
    });
});