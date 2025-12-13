import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongooseURL = process.env.mongooseURL;


export const connectDB = async () => {
    try {
        await mongoose.connect(mongooseURL);
        console.log('Database connected successfully');
    } catch (error) {
        console.log('Database connection failed',error);
        process.exit(1);
    }
    
}