const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    roleName: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    teamColor: {
        type: String,
        required: true
    },
    roleDescription: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Role', roleSchema);