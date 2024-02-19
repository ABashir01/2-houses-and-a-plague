import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Card, Collapse } from 'react-bootstrap'; 

function Game(props) {
    const [joined, setJoined] = useState(false);
    const [showRole, setShowRole] = useState(false);
    const [showColor, setShowColor] = useState(false);

    const navigate = useNavigate();
    const socket = props.socket;
    let playerRole = props.playerRole

    useEffect(() => {
        if (!joined) {
            socket.emit("joinGame", props.roomCode, (joinFail) => {
                if (joinFail) {
                    navigate("/");
                }

            });
            
            setJoined(true);
        }

        socket.on("getRole", (newPlayerRole) => {
            playerRole = newPlayerRole;
        });

        return () => {
            socket.off("joinGame");
            socket.off("getRole");
        };
    }, [joined, socket, props.roomCode, navigate]);

    const handleRole = () => {
        setShowRole(!showRole);
    };

    const handleColor = () => {
        setShowColor(!showColor);
    };

    return (
        <div className="container-fluid mt-5 h-100">
            <Card className="text-center h-100 d-flex flex-column justify-content-center align-items-center">
                <Card.Header as="h2" className="w-100">My Role</Card.Header>
                <Card.Body className="d-flex flex-column justify-content-center align-items-center w-100">
                    {/* <Card.Title as="h3">My Role</Card.Title> */}
                    <Collapse in={showRole || showColor}>
                        <div>
                            <Card.Text>
                                <hr />
                                <h5><b>Role Name:</b> {showRole ? playerRole.roleName : "???"}</h5>
                                <h5><b>Team Color:</b> {playerRole.teamColor}</h5>
                                <p><b>Role Description:</b> {showRole ? playerRole.roleDescription : "???"}</p>
                                <hr />
                              </Card.Text>
                        </div>
                    </Collapse>
                    <div className="w-75 d-flex justify-content-around mt-4">
                      <Button variant="primary" onClick={handleRole}>
                          {showRole ? "Hide Role" : "Show Role"}
                      </Button>
                      <Button variant="secondary" onClick={handleColor}>
                          {showColor ? "Hide Color" : "Show Color"}
                      </Button>
                    </div>
                    

                </Card.Body>
            </Card>
        </div>
    );
}

export default Game;
