"use client";

import React, { createContext, useContext, useState } from "react";

type User = { id: string; email: string; username: string };

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  setUserAndToken: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null
  );
  const [accessToken, setAccessToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  );

  const setUserAndToken = (u: User, token: string) => {
    setUser(u);
    setAccessToken(token);
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("accessToken", token);
  };

  const updateAccessToken = (token: string) => {
    setAccessToken(token);
    localStorage.setItem("accessToken", token);
  };

  const updateUser = (u: User) => {
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const clearAuth = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        setUserAndToken,
        setAccessToken: updateAccessToken,
        updateUser,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
