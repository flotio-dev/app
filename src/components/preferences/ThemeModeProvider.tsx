"use client";

import React, { createContext, useMemo, useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { darkTheme, lightTheme } from "@/theme";
import useLocalStorage from "@/hooks/useLocalStorage";

export const ThemeModeContext = createContext<{
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;
  toggleMode: () => void;
}>({
  mode: "dark",
  setMode: () => {},
  toggleMode: () => {},
});

export const ThemeModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useLocalStorage<"light" | "dark">("theme-mode", "dark");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (mode === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
    }
  }, [mode, mounted]);

  const toggleMode = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  const theme = useMemo(
    () => (mode === "dark" ? darkTheme : lightTheme),
    [mode]
  );

  if (!mounted) {
    return null;
  }

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

