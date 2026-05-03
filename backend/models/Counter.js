import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 100_000 },
});

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
