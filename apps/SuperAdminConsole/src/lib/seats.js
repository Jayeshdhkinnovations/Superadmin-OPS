// Seat counts are picked from a fixed list rather than typed freely: every
// seat has to be provisioned on shared hardware, and an open number field
// invited values (500, 1000) that could never actually be honoured.
// The self-serve registration form on the OpenSign side offers 1-5; a Super
// Admin gets the larger tiers as well.
export const SEAT_OPTIONS = [1, 2, 3, 4, 5, 10, 25, 50, 100];

export function seatLabel(n) {
  return `${n} ${n === 1 ? "User" : "Users"}`;
}

// An existing company may sit on a limit that predates this list (or was set
// by a later edit to the tiers). Surface it as its own option so opening the
// edit modal can't silently snap the company down to the nearest preset.
export function seatOptionsIncluding(current) {
  const n = Number(current);
  if (!n || SEAT_OPTIONS.includes(n)) return SEAT_OPTIONS;
  return [...SEAT_OPTIONS, n].sort((a, b) => a - b);
}
