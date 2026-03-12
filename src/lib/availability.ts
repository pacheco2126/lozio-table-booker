// Table configuration per location
export const TABLES_PER_LOCATION = 15;
export const TABLE_CAPACITY = 4;

/**
 * Estimated duration in minutes based on party size.
 * Base: 45 min for 2 people, +10 min per additional 2 people.
 */
export function estimatedDuration(guests: number): number {
  if (guests <= 2) return 45;
  return 45 + Math.ceil((guests - 2) / 2) * 10;
}

/**
 * Number of tables required for a party size (each table seats 4).
 */
export function tablesNeeded(guests: number): number {
  return Math.ceil(guests / TABLE_CAPACITY);
}

interface Reservation {
  reservation_time: string; // "HH:MM"
  guests: string;           // stored as text
}

/**
 * Convert "HH:MM" to minutes since midnight.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Given existing reservations for a location+date, compute which time slots
 * are unavailable because all 15 tables would be occupied.
 *
 * Returns a Set of time slot strings (e.g. "20:00") that are fully booked.
 */
export function getUnavailableSlots(
  existingReservations: Reservation[],
  timeSlots: string[],
  requestedGuests: number
): Set<string> {
  const unavailable = new Set<string>();
  const neededTables = tablesNeeded(requestedGuests);
  const requestedDuration = estimatedDuration(requestedGuests);

  for (const slot of timeSlots) {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + requestedDuration;

    // Count how many tables are occupied during this proposed slot
    let tablesInUse = 0;

    for (const res of existingReservations) {
      const resGuests = parseInt(res.guests) || 2;
      const resStart = timeToMinutes(res.reservation_time);
      const resEnd = resStart + estimatedDuration(resGuests);
      const resTables = tablesNeeded(resGuests);

      // Check overlap: two intervals [a,b) and [c,d) overlap if a < d && c < b
      if (slotStart < resEnd && resStart < slotEnd) {
        tablesInUse += resTables;
      }
    }

    // Not enough tables left for this party
    if (tablesInUse + neededTables > TABLES_PER_LOCATION) {
      unavailable.add(slot);
    }
  }

  return unavailable;
}
