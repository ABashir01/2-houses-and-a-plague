import React, {useState, useEffect} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {CopyToClipboard} from 'react-copy-to-clipboard';

import User from './User';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { Container, Row, Col, ListGroup, ListGroupItem } from 'react-bootstrap';

function MyLobby(props) {
    const [showModal, setShowModal] = useState(true);
    const [socketName, setSocketName] = useState("");
    const [nameEntered, setNameEntered] = useState(true);
    const [somebodyElseName, setSomebodyElseName] = useState(false);
    const [joined, setJoined] = useState(false);
    const [nameObj, setNameObj] = useState({});
    const [numberOfPlayers, setNumberOfPlayers] = useState(0);
    const [ready, setReady] = useState(false);
    const [isLeader, setIsLeader] = useState(false);
    const [copyClicked, setCopyClicked] = useState(false);
    const [unableToStartMessage, setUnableToStartMessage] = useState("");
    
    const lobbyCode = Number(useLocation().pathname.replace("/lobby/", ""));
    props.setRoomCode(lobbyCode);
    const navigate = useNavigate();
    const socket = props.socket;

    // const [copiedText, copyToClipboard] = useCopyToClipboard();
    // const hasCopiedText = Boolean(copiedText);
  
    const handleClose = (() => {
      if (!socketName) {
        setNameEntered(false);
      } else {
        socket.emit("set_name", socketName, lobbyCode);
      }
      
    });
  
    const handleChange = (event) => {
      setSocketName(event.target.value);
    }
  
    const handleReady = () => {
      setReady(!ready);
      socket.emit("ready", lobbyCode);
    }
  
    const handleStartGame = () => {
      socket.emit("startGame", lobbyCode);
    }

    const handleCopyClicked = () => {
        setCopyClicked(true);
    }
  
    useEffect(() => {
  
      socket.on("update_users", (roomObj) => {
        setNameObj(roomObj.users);
        setNumberOfPlayers(roomObj.numberOfPlayers);
      });
  
      socket.on("leave_room", ()=> {
        navigate('/');
        console.log("ROOM HAS BEEN CLOSED");
      });
  
      socket.on("clientStartGame", (allPlayersReady, lobbyCode) => {
        if (allPlayersReady) {
          let gameString = "/game/" + lobbyCode;
          navigate(gameString);
        }
      });

      socket.on("setRole", (randomizedRole) => {
        console.log(randomizedRole);
        props.setPlayerRole(randomizedRole);
      });
  
      socket.on("setLeader", () => {
        setIsLeader(true);
      });

      socket.on("closeNameModal", (closeModal) => {
        if (closeModal) {
            setShowModal(false);
        } else {
            setSomebodyElseName(true);
        }
      });

      socket.on("unableToStartGame", (message) => {
        setUnableToStartMessage(message);
      })
  
      if (!joined) {
        socket.emit("join_lobby", lobbyCode, (joinSuccess) => {
          console.log("join success:", joinSuccess);
          if (!joinSuccess) {
            console.log("ROOM DOESN'T EXIST YET");
            navigate('/');
          };
        });
  
        setJoined(true);
      }

      return () => {
        socket.off("update_users");
        socket.off("leave_room");
        socket.off("clientStartGame");
        socket.off("setRole");
        socket.off("setLeader");
        socket.off("closeNameModal");
      };
    }, [socket, joined, navigate, props, lobbyCode]);
  
    return (
      <Container className="mt-4">
          <Row className="justify-content-md-center">
              <Col md={6} className="text-center">
                  <CopyToClipboard text={window.location.href}>
                      <Button variant="secondary" onClick={handleCopyClicked}>{copyClicked ? "Copied!" : "Copy Invite"}</Button>
                  </CopyToClipboard>
                  <h1 className="mt-3">Players: {numberOfPlayers}</h1>
                  <ListGroup className="my-3 d-flex justify-content-center">
                      {Object.keys(nameObj).length > 0 && Object.keys(nameObj).map((socketID) => {
                          return nameObj[socketID].username && (
                              <ListGroupItem key={socketID} className="d-flex justify-content-center align-items-center">
                                  <User username={nameObj[socketID].username} ready={nameObj[socketID].ready}/>
                              </ListGroupItem>
                          );
                      })}
                  </ListGroup>
                  <Button variant={ready ? "danger" : "success"} onClick={handleReady}>
                      {ready ? "Unready" : "Ready"}
                  </Button>
                  {isLeader ? <Button variant="primary" onClick={handleStartGame}>Start Game</Button> : null}
                  
              </Col>
          </Row>

          <Modal show={showModal} onHide={handleClose} backdrop="static" keyboard={false} className="mt-5">
              <Modal.Header closeButton>
                  <Modal.Title>Enter Your Name</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <input type="text" className="form-control" placeholder='Name' onChange={handleChange} />
                  {!nameEntered && <p className="text-danger">Please enter a name</p>}
                  {somebodyElseName && <p className="text-danger">Name already in use</p>}
              </Modal.Body>
              <Modal.Footer>
                  <Button variant="primary" onClick={handleClose}>Submit</Button>
              </Modal.Footer>
          </Modal>

          <p className="text-danger">{unableToStartMessage}</p>
          <a href="https://cdn.1j1ju.com/medias/67/db/c8-two-rooms-and-a-boom-character-guide.pdf" target="_blank" rel="noreferrer" className="btn btn-dark mt-5" role="button">Roles</a>
          <p className="mt-4 text-muted">DISCLAIMER: Currently only supporting basic roles (President, Bomber, and Gambler)</p>
      </Container>
  );
}

  export default MyLobby;