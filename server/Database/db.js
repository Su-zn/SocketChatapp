import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongooseURL = process.env.mongooseURL || 'mongodb://localhost:27017/chatapp';


export const connectDB = async () => {
    try {
        if(!mongooseURL) {
            throw new Error('MongoDB URL is not defined');
        }
        console.log('Attempting to connect to MongoDB...');
        console.log('MongoDB URL:', mongooseURL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs
        await mongoose.connect(mongooseURL);
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
    
}