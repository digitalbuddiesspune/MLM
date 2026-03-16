import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const connectDb = async ()=>{
  try {
    const con = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected to ${con.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}
export default connectDb;