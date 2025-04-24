import React, { createContext, useContext, useEffect, useState } from "react";
import api, { loginUser, registerUser, logoutUser } from "../api/api";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const isLoggedIn = !!user;


  const login = async ({ username, password }) => {
    // eslint-disable-next-line no-useless-catch
    try {
      await loginUser({ username, password });

      const meRes = await api.get("/auth/me");
      setUser(meRes.data);   // { username: "...", _id: "..." }
      return true;
    } catch (err) {
      // 401 /
      throw err;
    }
  };

  //
  const register = async ({ username, password }) => {
    // eslint-disable-next-line no-useless-catch
    try {
      await registerUser({ username, password });

      await login({ username, password });
      return true;
    } catch (err) {
      // 409
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  };

  // App start
  useEffect(() => {
    (async () => {
      try {
        const meRes = await api.get("/auth/me");
        setUser(meRes.data);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  return (
      <AuthContext.Provider value={{ user, isLoggedIn, login, register, logout }}>
        {children}
      </AuthContext.Provider>
  );
};
