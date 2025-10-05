import axios, { AxiosError, AxiosInstance } from 'axios';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'college';
  phoneNumber: string;
  city: string;
  state: string;
  username: string;
  password: string;
  collegeLogo?: string;
}

export interface AuthResponse {
  token?: string;
  user?: Record<string, unknown>;
  message?: string;
}

export interface StateOption {
  label: string;
  value: string;
}

const BASE_URL = 'https://docquest-b3ii.onrender.com';
const REQUEST_TIMEOUT = 10000;
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/g;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_ERROR_MESSAGE = 'Unable to complete the request. Please try again later.';
const LOGIN_VALIDATION_MESSAGE = 'Invalid login data provided.';
const REGISTER_VALIDATION_MESSAGE = 'Invalid registration data provided.';

const isDevelopment =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

const ALLOWED_ROLES: ReadonlySet<RegisterPayload['role']> = new Set(['student', 'college']);
let activeAuthToken: string | null = null;

export function setAuthTokenHeader(token: string | null): void {
  activeAuthToken = token ? sanitizeString(token) : null;

  if (activeAuthToken) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${activeAuthToken}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export function getActiveAuthToken(): string | null {
  return activeAuthToken;
}

const withAuthHeader = (headers: Record<string, string>): Record<string, string> => {
  if (activeAuthToken) {
    headers.Authorization = `Bearer ${activeAuthToken}`;
  }
  return headers;
};

const FALLBACK_STATE_NAMES: ReadonlyArray<string> = [
  'andhra pradesh',
  'arunachal pradesh',
  'assam',
  'bihar',
  'chhattisgarh',
  'goa',
  'gujarat',
  'haryana',
  'himachal pradesh',
  'jharkhand',
  'karnataka',
  'kerala',
  'madhya pradesh',
  'maharashtra',
  'manipur',
  'meghalaya',
  'mizoram',
  'nagaland',
  'odisha',
  'punjab',
  'rajasthan',
  'sikkim',
  'tamil nadu',
  'telangana',
  'tripura',
  'uttar pradesh',
  'uttarakhand',
  'west bengal',
  'delhi',
  'jammu and kashmir',
  'ladakh',
  'andaman and nicobar islands',
  'chandigarh',
  'dadra and nagar haveli and daman and diu',
  'lakshadweep',
  'puducherry',
];

type UnknownRecord = Record<string, unknown>;

const sanitizeString = (value: string): string => value.replace(CONTROL_CHAR_REGEX, '').trim();

const toTitleCase = (value: string): string =>
  value
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const buildValidationError = (detail: string, fallback: string): Error =>
  new Error(isDevelopment ? detail : fallback);

const buildTransportError = (detail: string): Error =>
  new Error(isDevelopment ? detail : DEFAULT_ERROR_MESSAGE);

const sanitizeRequiredString = (
  value: unknown,
  fieldName: string,
  fallback: string,
): string => {
  if (typeof value !== 'string') {
    throw buildValidationError(`${fieldName} must be a string.`, fallback);
  }

  const sanitized = sanitizeString(value);

  if (!sanitized) {
    throw buildValidationError(`${fieldName} is required.`, fallback);
  }

  return sanitized;
};

const sanitizeDeep = <T>(input: T): T => {
  if (typeof input === 'string') {
    return sanitizeString(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeDeep(item)) as unknown as T;
  }

  if (input && typeof input === 'object') {
    const result: UnknownRecord = {};
    Object.entries(input as UnknownRecord).forEach(([key, val]) => {
      result[key] = sanitizeDeep(val);
    });
    return result as T;
  }

  return input;
};

const validatePayloadForTransport = (input: unknown, path: string = 'payload'): void => {
  if (input === undefined) {
    throw buildTransportError(`${path} contains an undefined value.`);
  }

  if (input === null) {
    return;
  }

  if (typeof input === 'function' || typeof input === 'symbol' || typeof input === 'bigint') {
    throw buildTransportError(`${path} contains a non-serializable value.`);
  }

  if (Array.isArray(input)) {
    input.forEach((item, index) => validatePayloadForTransport(item, `${path}[${index}]`));
    return;
  }

  if (typeof input === 'object') {
    Object.entries(input as UnknownRecord).forEach(([key, value]) => {
      validatePayloadForTransport(value, `${path}.${key}`);
    });
  }
};

const normalizeAuthResponse = (data: unknown, { requireToken }: { requireToken: boolean }): AuthResponse => {
  if (!data || typeof data !== 'object') {
    throw buildTransportError('Authentication response payload is missing.');
  }

  const record = data as UnknownRecord;
  const tokenRaw = record.token;
  const messageRaw = record.message;
  let token: string | undefined;

  if (typeof tokenRaw === 'string' && tokenRaw.trim()) {
    token = sanitizeString(tokenRaw);
  } else if (requireToken) {
    throw buildTransportError('Authentication response is missing a valid token.');
  }

  const rawUser = record.user;
  let user: Record<string, unknown> | undefined;

  if (rawUser !== undefined) {
    if (rawUser === null) {
      user = undefined;
    } else if (typeof rawUser === 'object' && !Array.isArray(rawUser)) {
      user = sanitizeDeep(rawUser) as Record<string, unknown>;
    } else {
      throw buildTransportError('Authentication response includes an invalid user payload.');
    }
  }

  const message = typeof messageRaw === 'string' ? sanitizeString(messageRaw) : undefined;

  return {
    token,
    user,
    message,
  };
};

function validateLoginPayload(payload: LoginPayload): LoginPayload {
  if (!payload || typeof payload !== 'object') {
    throw buildValidationError('Login payload must be an object.', LOGIN_VALIDATION_MESSAGE);
  }

  const username = sanitizeRequiredString(payload.username, 'username', LOGIN_VALIDATION_MESSAGE);
  const password = sanitizeRequiredString(payload.password, 'password', LOGIN_VALIDATION_MESSAGE);

  return { username, password };
}

function validateRegisterPayload(payload: RegisterPayload): RegisterPayload {
  if (!payload || typeof payload !== 'object') {
    throw buildValidationError('Register payload must be an object.', REGISTER_VALIDATION_MESSAGE);
  }

  const firstName = sanitizeRequiredString(payload.firstName, 'firstName', REGISTER_VALIDATION_MESSAGE);
  const lastName = sanitizeRequiredString(payload.lastName, 'lastName', REGISTER_VALIDATION_MESSAGE);
  const phoneNumberRaw = sanitizeRequiredString(payload.phoneNumber, 'phoneNumber', REGISTER_VALIDATION_MESSAGE);
  const phoneNumber = phoneNumberRaw.replace(/[^+\d]/g, '');
  const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    throw buildValidationError('Register payload contains an invalid phone number length.', REGISTER_VALIDATION_MESSAGE);
  }
  if (phoneNumber.indexOf('+') > 0) {
    throw buildValidationError('Register payload contains an invalid phone number format.', REGISTER_VALIDATION_MESSAGE);
  }

  const city = sanitizeRequiredString(payload.city, 'city', REGISTER_VALIDATION_MESSAGE);
  const state = sanitizeRequiredString(payload.state, 'state', REGISTER_VALIDATION_MESSAGE).toLowerCase();
  const username = sanitizeRequiredString(payload.username, 'username', REGISTER_VALIDATION_MESSAGE);
  const password = sanitizeRequiredString(payload.password, 'password', REGISTER_VALIDATION_MESSAGE);
  const collegeLogo =
    typeof payload.collegeLogo === 'string' ? sanitizeString(payload.collegeLogo) : undefined;

  const emailRaw = sanitizeRequiredString(payload.email, 'email', REGISTER_VALIDATION_MESSAGE).toLowerCase();
  if (!EMAIL_PATTERN.test(emailRaw)) {
    throw buildValidationError('Register payload contains an invalid email.', REGISTER_VALIDATION_MESSAGE);
  }

  const roleRaw = sanitizeRequiredString(payload.role, 'role', REGISTER_VALIDATION_MESSAGE).toLowerCase();
  if (!ALLOWED_ROLES.has(roleRaw as RegisterPayload['role'])) {
    throw buildValidationError('Register payload has an unsupported role.', REGISTER_VALIDATION_MESSAGE);
  }

  const sanitized: RegisterPayload = {
    firstName,
    lastName,
    email: emailRaw,
    role: roleRaw as RegisterPayload['role'],
    phoneNumber,
    city,
    state,
    username,
    password,
  };

  if (collegeLogo !== undefined) {
    sanitized.collegeLogo = collegeLogo;
  }

  return sanitized;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const shouldSanitize =
    config.data &&
    typeof config.data === 'object' &&
    !(typeof FormData !== 'undefined' && config.data instanceof FormData);

  if (shouldSanitize) {
    const sanitizedData = sanitizeDeep(config.data);
    validatePayloadForTransport(sanitizedData);
    config.data = sanitizedData;
  }

  if (config.headers) {
    if (activeAuthToken) {
      config.headers.Authorization = `Bearer ${activeAuthToken}`;
    } else {
      delete config.headers.Authorization;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    handleApiError(error);
  },
);

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const sanitizedPayload = validateLoginPayload(payload);

  try {
    const response = await apiClient.post<AuthResponse>('/login', sanitizedPayload);
    return normalizeAuthResponse(response.data, { requireToken: true });
  } catch (error) {
    handleApiError(error);
  }
}

export async function getStates(signal?: AbortSignal): Promise<ReadonlyArray<StateOption>> {
  const buildFallbackStates = () =>
    FALLBACK_STATE_NAMES.map((name) => ({
      label: toTitleCase(name),
      value: name,
    }));

  const requestInit: RequestInit = {
    method: 'GET',
    headers: withAuthHeader({
      Accept: 'application/json',
    }),
    signal,
  };

  try {
    const response = await fetch(`${BASE_URL}/getstates`, requestInit);

    if (!response.ok) {
      if (isDevelopment) {
        console.warn('[auth-api] /getstates returned non-ok', { status: response.status });
      }
      return buildFallbackStates();
    }

    const raw = (await response.json()) as unknown;
    const values: StateOption[] = [];
    const seen = new Set<string>();

    const pushIfValid = (candidate: unknown) => {
      if (typeof candidate !== 'string') {
        return;
      }
      const normalized = sanitizeString(candidate.toLowerCase());
      if (!normalized || seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      values.push({ label: toTitleCase(normalized), value: normalized });
    };

    const handleRecord = (record: Record<string, unknown>) => {
      const candidate =
        record.state_name ??
        record.stateName ??
        record.name ??
        record.label;
      if (typeof candidate === 'string') {
        pushIfValid(candidate);
      }
    };

    if (Array.isArray(raw)) {
      raw.forEach((item) => {
        if (typeof item === 'string') {
          pushIfValid(item);
        } else if (item && typeof item === 'object') {
          handleRecord(item as Record<string, unknown>);
        }
      });
    } else if (raw && typeof raw === 'object') {
      Object.values(raw as Record<string, unknown>).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((entry) => {
            if (typeof entry === 'string') {
              pushIfValid(entry);
            } else if (entry && typeof entry === 'object') {
              handleRecord(entry as Record<string, unknown>);
            }
          });
        } else if (value && typeof value === 'object') {
          handleRecord(value as Record<string, unknown>);
        }
      });
    }

    if (values.length === 0) {
      return buildFallbackStates();
    }

    values.sort((a, b) => a.label.localeCompare(b.label));
    return values;
  } catch (error) {
    if (isDevelopment) {
      console.warn('[auth-api] state request failed, using fallback data', { error });
    }
    return buildFallbackStates();
  }
}


export async function verifySession(signal?: AbortSignal): Promise<unknown> {
  const requestInit: RequestInit = {
    method: 'GET',
    headers: withAuthHeader({
      Accept: 'application/json',
    }),
    signal,
  };

  try {
    const response = await fetch(`${BASE_URL}/getdata`, requestInit);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      if (isDevelopment) {
        console.warn('[auth-api] /getdata non-ok', { status: response.status, result });
      }

      const error = new Error(
        response.status === 401 ? 'Session expired. Please sign in again.' : 'Unable to verify session.',
      ) as Error & { status?: number; body?: unknown };
      error.status = response.status;
      error.body = result;
      throw error;
    }

    if (isDevelopment) {
      console.log('[auth-api] verified session', { result });
    }

    return result;
  } catch (error) {
    if (isDevelopment) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? (error as { status?: number }).status
          : undefined;
      console.error('[auth-api] verify session failed', { message, status });
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const sanitizedPayload = validateRegisterPayload(payload);

  const body = {
    ...sanitizedPayload,
    collegeLogo: sanitizedPayload.collegeLogo ?? '',
  };

  const requestInit: RequestInit = {
    method: 'POST',
    headers: withAuthHeader({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify(body),
  };

  try {
    const response = await fetch(`${BASE_URL}/register`, requestInit);
    let raw: unknown = null;

    try {
      raw = await response.json();
    } catch (parseError) {
      if (isDevelopment) {
        console.warn('[auth-api] failed to parse /register response body', { parseError });
      }
    }

    if (!response.ok) {
      const status = response.status;
      if (isDevelopment) {
        console.warn('[auth-api] /register returned non-ok', { status, body: raw });
      }

      if (status === 409) {
        throw new Error('An account with these details already exists.');
      }

      if (status >= 400 && status < 500) {
        throw new Error('Please verify your details and try again.');
      }

      throw new Error(DEFAULT_ERROR_MESSAGE);
    }

    if (raw && typeof raw === 'object') {
      return normalizeAuthResponse(raw, { requireToken: false });
    }

    return { message: 'Account created successfully.' };
  } catch (error) {
    if (error instanceof Error) {
      if (isDevelopment) {
        console.error('[auth-api] register failed', { message: error.message });
      }
      throw error;
    }

    throw new Error(DEFAULT_ERROR_MESSAGE);
  }
}


function handleApiError(error: unknown): never {
  let message = DEFAULT_ERROR_MESSAGE;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const method = typeof axiosError.config?.method === 'string' ? axiosError.config.method.toUpperCase() : undefined;
    const endpoint = typeof axiosError.config?.url === 'string' ? sanitizeString(axiosError.config.url) : undefined;

    if (status === 400 || status === 401) {
      message = 'Invalid credentials. Please verify your details and try again.';
    } else if (status === 409) {
      message = 'An account with these details already exists.';
    } else if (status && status >= 500) {
      message = 'The service is currently unavailable. Please try again later.';
    }

    if (isDevelopment) {
      const safeLog = {
        scope: 'auth-api',
        status,
        method,
        endpoint,
        code: axiosError.code,
      };
      console.error('[auth-api] request failed', safeLog);
    }
  } else if (error instanceof Error) {
    if (isDevelopment) {
      console.error('[auth-api] unexpected error', { message: error.message });
      message = error.message;
    }
  } else if (isDevelopment) {
    console.error('[auth-api] received a non-error throw', { scope: 'auth-api' });
  }

  throw new Error(message);
}

