/**
 * Utility for persisting and toggling Starred / Favorite Matches in localStorage.
 */
const STORAGE_KEY = 'flashscore_starred_matches_v4';

export function getStarredMatchIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleStarMatchId(matchId: string): string[] {
  const current = getStarredMatchIds();
  let updated: string[];
  if (current.includes(matchId)) {
    updated = current.filter((id) => id !== matchId);
  } else {
    updated = [...current, matchId];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save starred matches to localStorage:', e);
  }
  return updated;
}

export function isMatchStarred(matchId: string): boolean {
  return getStarredMatchIds().includes(matchId);
}
