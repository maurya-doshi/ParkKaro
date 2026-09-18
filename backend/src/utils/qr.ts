import { v4 as uuidv4 } from 'uuid';

/**
 * QR data payload for booking verification.
 * Contains only the minimum information needed for verification.
 */
export interface QRPayload {
  bookingId: string;
  listingId: string;
  driverId: string;
  startTime: string;
  endTime: string;
  verificationCode: string;
}

/**
 * Generate QR verification data for a confirmed booking.
 * Returns a JSON-serializable payload and its base64-encoded string.
 *
 * The actual QR code image generation is handled by the frontend.
 * The backend provides the verified data that goes INTO the QR code.
 */
export function generateQRData(params: {
  bookingId: string;
  listingId: string;
  driverId: string;
  startTime: string;
  endTime: string;
}): { payload: QRPayload; encoded: string } {
  const verificationCode = uuidv4().substring(0, 8).toUpperCase();

  const payload: QRPayload = {
    bookingId: params.bookingId,
    listingId: params.listingId,
    driverId: params.driverId,
    startTime: params.startTime,
    endTime: params.endTime,
    verificationCode,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');

  return { payload, encoded };
}

/**
 * Decode and validate a QR payload from a base64-encoded string.
 */
export function decodeQRData(encoded: string): QRPayload | null {
  try {
    const json = Buffer.from(encoded, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);

    if (
      parsed.bookingId &&
      parsed.listingId &&
      parsed.driverId &&
      parsed.startTime &&
      parsed.endTime &&
      parsed.verificationCode
    ) {
      return parsed as QRPayload;
    }
    return null;
  } catch {
    return null;
  }
}
