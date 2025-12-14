import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongooseURL = process.env.mongooseURL || process.env.MONGODB_URL || 'mongodb://localhost:27017/chatapp';


export const connectDB = async () => {
    try {
        if(!mongooseURL) {
            throw new Error('MongoDB URL is not defined');
        }
        await mongoose.connect(mongooseURL);
        console.log('Database connected successfully');
    } catch (error) {
        console.log('Database connection failed',error);
        process.exit(1);
    }
    
}