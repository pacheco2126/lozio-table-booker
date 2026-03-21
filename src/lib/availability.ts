// Online reservation tables: Mesa 1-8, capacity 1-6 each
export const ONLINE_TABLES = 8;
export const MAX_ONLINE_GUESTS = 6;

/**
 * Fixed duration: 90 minutes (1h 30min) for all reservations.
 */
export function estimatedDuration(_guests: number): number {
  return 90;
}

// Keep legacy exports for backward compat
export const TABLES_PER_LOCATION = 15;
export const TABLE_CAPACITY = 6;

export function tablesNeeded(guests: number): number {
  return 1; // Now 1 table per reservation since each fits up to 6
}

interface Reservation {
  reservation_time: string;
  guests: string;
  table_id?: string | null;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Given existing reservations for a location+date, compute which time slots
 * are unavailable because all 8 online tables would be occupied.
 */
export function getUnavailableSlots(
  existingReservations: Reservation[],
  timeSlots: string[],
  requestedGuests: number
): Set<string> {
  const unavailable = new Set<string>();
  const requestedDuration = estimatedDuration(requestedGuests);

  for (const slot of timeSlots) {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + requestedDuration;

    // Count how many tables are occupied during this proposed slot
    let tablesInUse = 0;

    for (const res of existingReservations) {
      const resStart = timeToMinutes(res.reservation_time);
      const resEnd = resStart + 90;

      // Check overlap
      if (slotStart < resEnd && resStart < slotEnd) {
        tablesInUse += 1;
      }
    }

    // All 8 online tables occupied
    if (tablesInUse >= ONLINE_TABLES) {
      unavailable.add(slot);
    }
  }

  return unavailable;
}
