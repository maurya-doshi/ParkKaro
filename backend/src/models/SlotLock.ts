/**
 * SlotLock model — corresponds to parkkaro-slot-locks table.
 * Used for atomic reservation and double-booking prevention.
 */

export interface SlotLock {
  listingId: string;
  slotKey: string; // e.g. {date}#{slotIndex} or {date}#{slotIndex}#space{N}
  bookingId: string;
  driverId: string;
  startTime: string;
  endTime: string;
  status: 'BOOKED' | 'RELEASED';
  createdAt: string;
}
