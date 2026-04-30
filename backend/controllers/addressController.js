import Address from '../models/Address.js';

const NAME_REGEX = /^(?=.*\b[A-Za-z]{3,}\b)[A-Za-z ]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;

function normalizeText(value) {
  return String(value ?? '').trim();
}

function inferStateFromPincodeFallback(pincode) {
  const prefix = Number(pincode.slice(0, 2));
  if (prefix >= 40 && prefix <= 44) return 'Maharashtra';
  return '';
}

async function detectLocationFromPincode(pincode) {
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (!response.ok) throw new Error('State lookup failed');
    const data = await response.json();
    const first = Array.isArray(data) ? data[0] : null;
    const postOffice = first?.PostOffice?.[0];
    const state = normalizeText(postOffice?.State) || inferStateFromPincodeFallback(pincode);
    const district = normalizeText(postOffice?.District);
    const tehsil = normalizeText(postOffice?.Taluk || postOffice?.Block || postOffice?.Name);
    return { state, district, tehsil };
  } catch {
    return {
      state: inferStateFromPincodeFallback(pincode),
      district: '',
      tehsil: '',
    };
  }
}

export async function detectAddressState(req, res, next) {
  try {
    const pincode = normalizeText(req.query.pincode);
    if (!PINCODE_REGEX.test(pincode)) {
      return res.status(400).json({ success: false, error: 'Pincode must be exactly 6 digits' });
    }
    const location = await detectLocationFromPincode(pincode);
    if (!location.state || !location.district || !location.tehsil) {
      return res.status(404).json({ success: false, error: 'Unable to detect state/district/tehsil for this pincode' });
    }
    res.json({
      success: true,
      data: {
        pincode,
        state: location.state,
        district: location.district,
        tehsil: location.tehsil,
      },
    });
  } catch (error) {
    next(error);
  }
}

function validateAddressPayload(payload) {
  const fullName = normalizeText(payload.fullName);
  const phone = normalizeText(payload.phone);
  const pincode = normalizeText(payload.pincode);

  if (!NAME_REGEX.test(fullName)) {
    return { error: 'Full Name must contain at least one word with minimum 3 letters' };
  }
  if (!PHONE_REGEX.test(phone)) {
    return { error: 'Phone must start with 6/7/8/9 and be exactly 10 digits' };
  }
  if (!PINCODE_REGEX.test(pincode)) {
    return { error: 'Pincode must be exactly 6 digits' };
  }
  return { fullName, phone, pincode };
}

export async function getMyAddresses(req, res, next) {
  try {
    const addresses = await Address.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: { addresses } });
  } catch (error) {
    next(error);
  }
}

export async function createMyAddress(req, res, next) {
  try {
    const parsed = validateAddressPayload(req.body ?? {});
    if (parsed.error) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const location = await detectLocationFromPincode(parsed.pincode);
    if (!location.state || !location.district || !location.tehsil) {
      return res.status(400).json({ success: false, error: 'Unable to detect state/district/tehsil for this pincode' });
    }

    const created = await Address.create({
      userId: req.userId,
      ...parsed,
      district: location.district,
      tehsil: location.tehsil,
      state: location.state,
    });

    res.status(201).json({ success: true, data: { address: created } });
  } catch (error) {
    next(error);
  }
}
