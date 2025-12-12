import mongoose from 'mongoose';


const mongooseURL = 'mongodb://localhost:27017/chatapp';


export const connectDB = async () => {
    try {
        await mongoose.connect(mongooseURL);
        console.log('Database connected successfully');
    } catch (error) {
        console.log('Database connection failed',error);
        process.exit(1);
    }
    
}