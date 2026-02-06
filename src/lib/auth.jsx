import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { clearSession, getMe, getToken, getUser, login as apiLogin, setUser } from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => getUser());
  const [loading, setLoading] = useState(false);
  const lastTokenRef = useRef(null);

  const refreshUser = useCallback(async () => {
    if (!getToken()) return null;
    try {
      const me = await getMe();
      if (me) {
        setUser(me);
        setUserState(me);
      }
      return me;
    } catch (error) {
      return null;
    }
  }, []);

  const login = useCallback(
    async (credentials) => {
      setLoading(true);
      try {
        await apiLogin(credentials);
        setTokenState(getToken());
        const me = await refreshUser();
        return me;
      } finally {
        setLoading(false);
      }
    },
    [refreshUser]
  );

  const logout = useCallback(() => {
    clearSession();
    setTokenState(null);
    setUserState(null);
  }, []);

  useEffect(() => {
    if (!token) return;
    if (token !== lastTokenRef.current) {
      lastTokenRef.current = token;
      refreshUser();
    }
  }, [token, refreshUser]);

  const value = useMemo(
    () => ({ token, user, loading, setUser: setUserState, login, logout, refreshUser }),
    [token, user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro do AuthProvider");
  }
  return context;
};

