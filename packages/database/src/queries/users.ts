import type {
  DatabaseAdapter,
  CreateUserInput,
  UpdateUserPreferencesInput,
} from '../adapters/types.js';
import type { User, UserPreferences } from '../schema/index.js';
import { PostgresDatabaseAdapter, type DrizzleDatabase } from '../adapters/postgres.js';

function getAdapter(target: DatabaseAdapter | DrizzleDatabase): DatabaseAdapter {
  if (typeof target === 'object' && target !== null && 'createUser' in target) {
    return target as DatabaseAdapter;
  }
  return new PostgresDatabaseAdapter(target);
}

export async function createUser(
  target: DatabaseAdapter | DrizzleDatabase,
  input: CreateUserInput
): Promise<User> {
  return getAdapter(target).createUser(input);
}

export async function getUserById(
  target: DatabaseAdapter | DrizzleDatabase,
  id: string
): Promise<User | null> {
  return getAdapter(target).getUserById(id);
}

export async function getUserByEmail(
  target: DatabaseAdapter | DrizzleDatabase,
  email: string
): Promise<User | null> {
  return getAdapter(target).getUserByEmail(email);
}

export async function getUserPreferences(
  target: DatabaseAdapter | DrizzleDatabase,
  userId: string
): Promise<UserPreferences | null> {
  return getAdapter(target).getUserPreferences(userId);
}

export async function updateUserPreferences(
  target: DatabaseAdapter | DrizzleDatabase,
  userId: string,
  input: UpdateUserPreferencesInput
): Promise<UserPreferences> {
  return getAdapter(target).updateUserPreferences(userId, input);
}
