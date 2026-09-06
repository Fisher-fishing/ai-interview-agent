import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import * as authApi from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    authApi
      .getCurrentUser()
      .then((data) => {
        if (active) {
          setUser(data.user);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function register(email, password) {
    const data = await authApi.register(email, password);
    setUser(data.user);
  }

  async function login(email, password) {
    const data = await authApi.login(email, password);
    setUser(data.user);
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("退出请求失败：", error);
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth 必须在 AuthProvider 内使用。");
  }

  return context;
}