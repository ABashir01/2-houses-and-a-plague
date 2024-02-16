import React from 'react';

function User(props) {
    return (
        <div class="border rounded d-flex flex-row justify-content-center align-items-center w-100 mt-2 mb-2">
            <p>{props.username + " "} </p>
            <p>{props.ready ? " | READY!" : " | NOT READY!"}</p>
        </div>
    )};

export default User;