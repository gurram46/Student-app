import { Platform } from 'react-native';

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';
const CONTROL_CHAR_PATTERN = /[\x00-\x1F\x7F]/g;

const sanitizeMessage = (message: string): string =>
  message.replace(CONTROL_CHAR_PATTERN, '').trim();

export const mapAuthError = (error: unknown, fallbackMessage: string = DEFAULT_MESSAGE): string => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.error('[auth-screen] captured error', error);
  }

  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === 'string') {
    const sanitized = sanitizeMessage(error);
    return sanitized || fallbackMessage;
  }

  if (error instanceof Error) {
    const sanitized = sanitizeMessage(error.message);
    if (!sanitized || sanitized === 'Error') {
      return fallbackMessage;
    }
    if (!__DEV__ && sanitized.toLowerCase().includes('network')) {
      return 'Check your connection and try again.';
    }
    return sanitized;
  }

  if (typeof error === 'object') {
    const candidate = 'message' in error ? (error as { message?: unknown }).message : undefined;
    if (typeof candidate === 'string') {
      const sanitized = sanitizeMessage(candidate);
      return sanitized || fallbackMessage;
    }
  }

  return fallbackMessage;
};

export const isIosPlatform = (): boolean => Platform.OS === 'ios';