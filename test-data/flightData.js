const TZ = 'Asia/Calcutta';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * ISO date (YYYY-MM-DD) for "today + offsetDays" in IST.
 * Uses Intl so it is correct even if the machine runs in another timezone.
 */
function getDateOffset(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const d = new Date(Date.UTC(get('year'), get('month') - 1, get('day') + offsetDays));
  return d.toISOString().slice(0, 10);
}

function getToday() {
  return getDateOffset(0);
}

function getTomorrow() {
  return getDateOffset(1);
}

/** Regex for how Booking shows a date in the field, e.g. "Tue 10 Nov" / "10 Nov 2026". */
function displayPattern(iso) {
  const [, month, day] = iso.split('-').map(Number);
  return new RegExp(`\\b${day}\\s+${MONTHS[month - 1]}\\b`, 'i');
}

const airports = {
  delhi: 'DEL',
  mumbai: 'BOM',
  bengaluru: 'BLR',
  hyderabad: 'HYD',
};

module.exports = { getToday, getTomorrow, getDateOffset, displayPattern, airports };
