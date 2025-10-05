// @ts-ignore - native module provided by react-native-keychain
import * as Keychain from 'react-native-keychain';

const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/g;
const SERVICE_NAME = 'student-app-session';
const KEYCHAIN_USERNAME = 'auth';

export interface AuthSession {
  token: string;
  role: 'student' | 'college';
  username: string;
  user?: Record<string, unknown>;
}

const sanitize = (value: string): string => value.replace(CONTROL_CHAR_PATTERN, '').trim();

const serializeSession = (session: AuthSession): string =>
  JSON.stringify({
    token: sanitize(session.token),
    role: session.role,
    username: sanitize(session.username),
    user: session.user ?? undefined,
  });

export async function saveAuthSession(session: AuthSession): Promise<void> {
  const sanitizedToken = sanitize(session.token);

  if (!sanitizedToken) {
    throw new Error('Unable to store empty session token.');
  }

  const payload = serializeSession(session);

  try {
    const didStore = await Keychain.setGenericPassword(KEYCHAIN_USERNAME, payload, {
      service: SERVICE_NAME,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    });

    if (!didStore) {
      throw new Error('Secure storage rejected the session payload.');
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[storage] auth session securely persisted', {
        username: session.username,
        role: session.role,
      });
    }
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('[storage] failed to persist auth session', error);
    }
    throw new Error('Failed to persist session. Please retry.');
  }
}

export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: SERVICE_NAME });

    if (!credentials) {
      return null;
    }

    const raw = credentials.password;
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed?.token) {
      return null;
    }

    return {
      token: sanitize(String(parsed.token)),
      role:
        parsed.role === 'student' || parsed.role === 'college'
          ? parsed.role
          : 'student',
      username: parsed.username ? sanitize(String(parsed.username)) : '',
      user: parsed.user,
    };
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('[storage] failed to read auth session', error);
    }
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE_NAME });
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[storage] auth session cleared');
    }
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('[storage] failed to clear auth session', error);
    }
  }
}

export async function saveAuthToken(token: string): Promise<void> {
  const existing = await getAuthSession();
  await saveAuthSession({
    token,
    role: existing?.role ?? 'student',
    username: existing?.username ?? '',
    user: existing?.user,
  });
}

export async function getAuthToken(): Promise<string | null> {
  const session = await getAuthSession();
  return session?.token ?? null;
}

export async function clearAuthToken(): Promise<void> {
  await clearAuthSession();
}
