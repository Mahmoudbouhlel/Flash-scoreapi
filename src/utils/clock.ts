/**
 * Utility function to format match clock and elapsed live minute badges.
 * Formats raw minute strings like "22", "22 min", "24", "30", "45+2", "68" into
 * standardized badges like "1HT 22'", "1HT 24'", "1HT 30'", "1HT 45+2'", "2HT 68'", "HT", "FT".
 */
export function formatMatchClock(elapsed: string | number | null | undefined, status?: string): string {
  if (elapsed === null || elapsed === undefined || elapsed === '') {
    if (status) {
      const lower = status.toLowerCase();
      if (lower.includes('half') || lower === 'ht') return 'HT';
      if (lower.includes('finish') || lower === 'ft') return 'FT';
      if (status !== 'Live' && status !== 'Scheduled') return status;
    }
    return 'Live';
  }

  const str = String(elapsed).trim();
  if (!str || str === 'Live') return 'Live';
  if (str === 'HT' || str === 'FT' || str === 'AET' || str === 'AP') return str;

  // Already prefixed with 1HT or 2HT
  if (str.startsWith('1HT') || str.startsWith('2HT')) {
    const cleaned = str.replace(/'/g, '').trim();
    return `${cleaned}'`;
  }

  if (str.toLowerCase().includes('half time') || str.toLowerCase() === 'ht') {
    return 'HT';
  }

  if (str.toLowerCase().includes('finished') || str.toLowerCase() === 'ft') {
    return 'FT';
  }

  // Strip min/mins/quotes/extra spaces
  const clean = str.replace(/min|mins|'/gi, '').trim();

  // Check stoppage time like "45+2" or "90+4"
  if (clean.includes('+')) {
    const parts = clean.split('+');
    const base = parseInt(parts[0], 10);
    const extra = parseInt(parts[1], 10);
    if (!isNaN(base) && !isNaN(extra)) {
      return base <= 45 ? `1HT ${base}+${extra}'` : `2HT ${base}+${extra}'`;
    }
  }

  const num = parseInt(clean, 10);
  if (!isNaN(num)) {
    if (num <= 45) {
      return `1HT ${num}'`;
    } else {
      return `2HT ${num}'`;
    }
  }

  return str.endsWith("'") ? str : `${str}'`;
}
