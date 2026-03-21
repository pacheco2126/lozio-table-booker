// Online reservation tables: Mesa 1-8, capacity 1-6 each
export const ONLINE_TABLES = 8;
export const MAX_ONLINE_GUESTS = 6;
export const ONLINE_TABLE_NAMES = ["Mesa 1","Mesa 2","Mesa 3","Mesa 4","Mesa 5","Mesa 6","Mesa 7","Mesa 8"];

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

interface TableInfo {
  id: string;
  name: string;
  capacity: number;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Given existing reservations for a location+date and available tables,
 * compute which time slots are unavailable because no suitable table
 * (with enough capacity for the requested guests) is free.
 */
export function getUnavailableSlots(
  existingReservations: Reservation[],
  timeSlots: string[],
  requestedGuests: number,
  tables?: TableInfo[]
): Set<string> {
  const unavailable = new Set<string>();
  const requestedDuration = estimatedDuration(requestedGuests);

  // Filter to only online tables that can fit the requested guests
  const suitableTables = tables
    ? tables.filter(t => ONLINE_TABLE_NAMES.includes(t.name) && t.capacity >= requestedGuests)
    : null;

  // If we have table info and no table can fit the guests, all slots unavailable
  if (suitableTables && suitableTables.length === 0) {
    for (const slot of timeSlots) {
      unavailable.add(slot);
    }
    return unavailable;
  }

  for (const slot of timeSlots) {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + requestedDuration;

    if (suitableTables) {
      // Check if at least one suitable table is free during this slot
      const hasAvailableTable = suitableTables.some(table => {
        // Check if this table has any overlapping reservation
        const isOccupied = existingReservations.some(res => {
          if (res.table_id !== table.id) return false;
          const resStart = timeToMinutes(res.reservation_time);
          const resEnd = resStart + 90;
          return slotStart < resEnd && resStart < slotEnd;
        });
        return !isOccupied;
      });

      if (!hasAvailableTable) {
        unavailable.add(slot);
      }
    } else {
      // Fallback: count total tables in use
      let tablesInUse = 0;
      for (const res of existingReservations) {
        const resStart = timeToMinutes(res.reservation_time);
        const resEnd = resStart + 90;
        if (slotStart < resEnd && resStart < slotEnd) {
          tablesInUse += 1;
        }
      }
      if (tablesInUse >= ONLINE_TABLES) {
        unavailable.add(slot);
      }
    }
  }

  return unavailable;
}
