import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    room: {
        type: String,
        default: 'room'
    }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;