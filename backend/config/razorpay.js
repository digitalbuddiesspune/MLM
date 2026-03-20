import 'dotenv/config';
import Razorpay from 'razorpay';

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? '';

export function getRazorpayClient() {
  if (!KEY_ID || !KEY_SECRET) {
    const err = new Error('Razorpay key configuration missing');
    err.statusCode = 500;
    throw err;
  }
  return new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET,
  });
}

export function getRazorpayKeyId() {
  return KEY_ID;
}

export function getRazorpayKeySecret() {
  return KEY_SECRET;
}
