import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { authService } from '../api/services';

// ─── State Shape ───────────────────────────────────────
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // true until we've checked localStorage
  error: null,
};

// ─── Reducer ───────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_INIT':
      return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true, isLoading: false, error: null };
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true, isLoading: false, error: null };
    case 'AUTH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'AUTH_LOGOUT':
      return { ...initialState, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ──────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: hydrate from localStorage
  useEffect(() => {
    const token = localStorage.getItem('assetflow_token');
    const userRaw = localStorage.getItem('assetflow_user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        dispatch({ type: 'AUTH_INIT', payload: { user, token } });
      } catch {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } else {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // ─── Actions ───────────────────────────────────────
  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const { token, user } = await authService.login(email, password);
      localStorage.setItem('assetflow_token', token);
      localStorage.setItem('assetflow_user', JSON.stringify(user));
      dispatch({ type: 'AUTH_SUCCESS', payload: { token, user } });
      return { success: true };
    } catch (err) {
      const message = err.message || 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    ...state,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
