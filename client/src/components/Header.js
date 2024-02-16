import React from 'react';

function Header() {
    return (
        <nav className="navbar navbar-expand-lg navbar-white bg-white w-100 text-center d-flex justify-content-center">
            <img src={process.env.PUBLIC_URL + '/vector-bomb-transparent.png'} width="70" height="70" alt="Bomb Vector Image"></img>
            {/* <ul className='navbar-nav'>
                <li className='nav-item'>
                    <a className='nav-link' href></a>
                </li>
            </ul> */}
        </nav>
    )};

export default Header;