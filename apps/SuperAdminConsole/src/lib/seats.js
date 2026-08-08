// Seat limits are picked from fixed tiers rather than typed as a free
// number: every seat has to be provisioned on shared hardware, and an open
// field invited values (500, 1000) that could never actually be honoured.
//
// The label is a range ("1-10") because the number is a ceiling, not an
// allocation - a company on this tier may create anywhere from 1 up to
// `value` users. Kept in step with apps/OpenSign/src/constant/seatTiers.js,
// which backs the self-serve registration form in the other repo.
export const SEAT_TIERS = [
  { value: 5, label: "1-5" },
  { value: 10, label: "1-10" },
  { value: 25, label: "1-25" },
  { value: 50, label: "1-50" },
  { value: 100, label: "1-100" },
];

export function seatLabel(value) {
  const tier = SEAT_TIERS.find((t) => t.value === Number(value));
  return `${tier ? tier.label : `1-${value}`} Users`;
}

// An existing company may sit on a limit that predates these tiers (or was
// set before the list changed). Surface it as its own option so opening the
// edit modal can't silently snap the company down to the nearest tier.
export function seatTiersIncluding(current) {
  const n = Number(current);
  if (!n || SEAT_TIERS.some((t) => t.value === n)) return SEAT_TIERS;
  return [...SEAT_TIERS, { value: n, label: `1-${n}` }].sort((a, b) => a.value - b.value);
}
