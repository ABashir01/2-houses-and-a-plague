import React from 'react';

function User(props) {
    return (
        <div class="border rounded d-flex flex-row justify-content-center align-items-center w-100 mt-2 mb-2">
            <p>{props.username + " | "}{props.ready ? <strong>READY!</strong> : "NOT READY!"}</p>
            
        </div>
    )};

export default User;