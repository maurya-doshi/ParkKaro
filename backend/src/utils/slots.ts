/**
 * Time-slot utilities for 30-minute interval discretization and reservation.
 */

/**
 * Convert time (HH:mm) to a 30-minute slot index (0 to 47).
 * Formula: slotIndex = (hour * 2) + (minute >= 30 ? 1 : 0)
 */
export function timeToSlotIndex(time: string): number {
  const [hourStr, minStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const min = parseInt(minStr, 10);
  return hour * 2 + (min >= 30 ? 1 : 0);
}

/**
 * Convert a 30-minute slot index (0 to 47) back to HH:mm.
 */
export function slotIndexToTime(slotIndex: number): string {
  const hour = Math.floor(slotIndex / 2);
  const min = (slotIndex % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export interface SlotInfo {
  time: string;
  slotIndex: number;
  slotKey: string; // {date}#{slotIndex}
}

/**
 * Generate 30-minute interval slots for half-open range [startTime, endTime).
 */
export function getTimeSlotsForRange(
  date: string,
  startTime: string,
  endTime: string
): SlotInfo[] {
  const startIdx = timeToSlotIndex(startTime);
  const endIdx = timeToSlotIndex(endTime);

  const slots: SlotInfo[] = [];
  for (let idx = startIdx; idx < endIdx; idx++) {
    slots.push({
      time: slotIndexToTime(idx),
      slotIndex: idx,
      slotKey: `${date}#${idx}`,
    });
  }
  return slots;
}

/**
 * Generate all 30-minute slots within operating hours [openTime, closeTime].
 */
export function generateOperatingSlots(
  date: string,
  openTime: string,
  closeTime: string
): SlotInfo[] {
  const openIdx = timeToSlotIndex(openTime);
  const closeIdx = timeToSlotIndex(closeTime);

  const slots: SlotInfo[] = [];
  for (let idx = openIdx; idx <= closeIdx; idx++) {
    slots.push({
      time: slotIndexToTime(idx),
      slotIndex: idx,
      slotKey: `${date}#${idx}`,
    });
  }
  return slots;
}
