import type { DatabaseAdapter, AddSearchHistoryInput } from '../adapters/types.js';
import type { SearchHistoryItem } from '../schema/index.js';
import { PostgresDatabaseAdapter, type DrizzleDatabase } from '../adapters/postgres.js';

function getAdapter(target: DatabaseAdapter | DrizzleDatabase): DatabaseAdapter {
  if (typeof target === 'object' && target !== null && 'addSearchHistory' in target) {
    return target as DatabaseAdapter;
  }
  return new PostgresDatabaseAdapter(target);
}

export async function addSearchHistory(
  target: DatabaseAdapter | DrizzleDatabase,
  input: AddSearchHistoryInput
): Promise<SearchHistoryItem> {
  return getAdapter(target).addSearchHistory(input);
}

export async function getSearchHistory(
  target: DatabaseAdapter | DrizzleDatabase,
  userId?: string | null,
  limit = 20
): Promise<SearchHistoryItem[]> {
  return getAdapter(target).getSearchHistory(userId, limit);
}

export async function clearSearchHistory(
  target: DatabaseAdapter | DrizzleDatabase,
  userId?: string | null
): Promise<boolean> {
  return getAdapter(target).clearSearchHistory(userId);
}
