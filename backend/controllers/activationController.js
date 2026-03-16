import { activateUser, ACTIVATION_AMOUNT_INR } from '../services/activationService.js';

/**
 * POST /api/activation
 * Body: { userId, amount: 1500, paymentReference? }
 */
export async function activate(req, res, next) {
  try {
    const { userId, amount, paymentReference } = req.body;
    const user = await activateUser(userId, { amount, paymentReference });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/activation/amount – return required activation amount for clients
 */
export async function getActivationAmount(req, res) {
  res.json({ amount: ACTIVATION_AMOUNT_INR, currency: 'INR' });
}
