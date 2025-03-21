const mongoose = require('mongoose');

// message schema
const messageSchema = new mongoose.Schema({
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    receiver: {type: mongoose.Schema.Types.ObjectId, ref: 'User',},     // personal chats
    group: {type: mongoose.Schema.Types.ObjectId, ref:'Group'},         // group chat
    content: {type: String, required: true},
    timestamp: {type: Date, default: Date.now},
});

module.exports = mongoose.model('Message', messageSchema);