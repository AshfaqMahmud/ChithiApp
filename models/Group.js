const mongoose = require('mongoose');

// group schema
const groupSchema = new mongoose.Schema({
    name: {type: String, required: true},
    admin: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
});

module.exports = mongoose.model('Group', groupSchema);