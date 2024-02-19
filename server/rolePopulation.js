const mongoose = require('mongoose');
const Role = require('./roleModel');
const connectDB = require('./connectMongo');

require('dotenv').config();

connectDB();

const roles = [
    {
        roleName: "President", 
        teamColor: "Blue", 
        roleDescription: "Blue Team wins if you do not gain the 'dead' condition."},
    {
        roleName: "Bomber", 
        teamColor: "Red", 
        roleDescription: "Everyone in the same room as you at the end of the game gains the 'dead' condition."},
    {
        roleName: "Blue Team", 
        teamColor: "Blue", 
        roleDescription: "You are on the Blue Team."},
    {
        roleName: "Red Team", 
        teamColor: "Red", 
        roleDescription: "You are on the Red Team."},
    {
        roleName: "Gambler", 
        teamColor: "Gray", 
        roleDescription: "At the end of the last round, before players reveal their cards, you must publicly announce which team you think won. If you are correct, you win."},
];

Role.deleteMany({})
    .then(() => {
        console.log("Roles deleted succesfully");

        Role.insertMany(roles) 
            .then(() => {
                console.log("Roles added succesfully");
                mongoose.connection.close();
            })
    })

    .catch(err => {
        console.error("Error adding Roles: \n", err);
        mongoose.connection.close();
    })

// User.insertMany(roles) 
//     .then(() => {
//         console.log("Users added succesfully");
//         mongoose.connection.close();
//     })
//     .catch(err => {
//         console.error("Error adding users: \n", err);
//         mongoose.connection.close();
//     })

