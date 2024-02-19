import './App.css';
import React, {useState} from 'react';
import io from 'socket.io-client';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';

import HomePage from './components/HomePage';
import MyLobby from './components/MyLobby';
import Game from './components/Game';
import Header from './components/Header';


const socket = io.connect(process.env.REACT_APP_SERVER_URL);

function App() {
  const [myRoomCode, setMyRoomCode] = useState(null);
  const [playerRole, setPlayerRole] = useState(null);


  return (
    <Router>
      <div className='App d-flex flex-column justify-content-center align-items-center h-100'>
        <Header />
        <Routes>
          <Route exact path="/" element={(<HomePage socket={socket} setRoomCode={setMyRoomCode}/>)} /> 
          
          <Route path="/lobby/:roomCode" element={<MyLobby socket={socket} roomCode={myRoomCode} setRoomCode={setMyRoomCode} setPlayerRole={setPlayerRole}/>}/>

          <Route path="/game/:roomCode" element={< Game socket={socket} roomCode={myRoomCode} playerRole={playerRole}/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
