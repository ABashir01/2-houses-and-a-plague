import React, {useState} from "react";
import { useNavigate} from "react-router-dom";
import {Button, Modal, ModalBody} from 'react-bootstrap';

function HomePage(props) {
    const navigate = useNavigate();
    const socket = props.socket;
    const [myRoomCode, setMyRoomCode] = useState("");
    const [noRoomCode, setNoRoomCode] = useState(false);
    const [creatingRoom, setCreatingRoom] = useState(false)
  
    // This function calls the socket event to join a new room then sets the room code
    function createNewRoom() {

      setTimeout(() => {
        setCreatingRoom(true);
      }, "10000")

      socket.emit("create_lobby" , (roomCode) => {
        console.log('/lobby/', roomCode);
        props.setRoomCode(roomCode);
  
        let lobbyString = '/lobby/' + roomCode.toString();
        navigate(lobbyString);
      });
    }

    function goToRoom() {
      if (myRoomCode) {
        let lobbyString = '/lobby/' + myRoomCode.toString();
        navigate(lobbyString);
      } else {
        setNoRoomCode(true);
      }
    }

    function roomCodeChange(event) {
      setMyRoomCode(event.target.value);
    }
  
    return (
      <div className='homePage mt-4'>
        <Modal
          show={creatingRoom}
          backdrop="static"
          keyboard={false}
        >
          <ModalBody>
            creating Lobby...
          </ModalBody>

        </Modal>
        <h1 className="font-weight-bold mb-0">Two Houses and a Plague</h1>
        <p className="mt-0 font text-secondary">Web Version of Two Rooms and a Boom</p>
        <hr/>
        <Button className="create-lobby-btn mt-3 btn btn-lrg " variant="primary" onClick={createNewRoom}>Create Lobby</Button>
        <form className="d-flex justify-content-center mt-3">
          <input onChange={roomCodeChange} placeholder="Enter room code here"></input>
          <Button onClick={goToRoom} variant="secondary">Join</Button>
        </form>
        {noRoomCode ? <p className="text-danger">Please enter a room code</p> : null}
        <a href="https://cdn.1j1ju.com/medias/ef/63/0c-two-rooms-and-a-boom-rulebook.pdf" target="_blank" rel="noreferrer" className="btn btn-dark mt-5" role="button">Rulebook</a>
        <div className="w-75 d-flex flex-column m-auto">
          <p className="mt-5 mb-1 text-muted small">Website made by <a href="https://ahad-bashir-portfolio.netlify.app/" className="text-muted" target="_blank" rel="noreferrer">Ahad Bashir</a></p>
          <p className="mb-1 text-muted small"><a href="https://www.tuesdayknightgames.com/tworoomsandaboom" target="_blank" rel="noreferrer" className="text-muted">Two Rooms and a Boom</a> designed by Tuesday Knight Games</p>
          <a className="m-0 text-muted small" href="https://github.com/ABashir01/2-houses-and-a-plague" target="_blank" rel="noreferrer">Github</a>
        </div>
        
      </div>
  )};

export default HomePage;