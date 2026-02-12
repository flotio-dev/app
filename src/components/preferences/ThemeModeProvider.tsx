"use client";

import React, { createContext, useMemo, useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { darkTheme, lightTheme } from "@/theme";
import useLocalStorage from "@/hooks/useLocalStorage";

export const ThemeModeContext = createContext<{
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;
}>({
  mode: "dark",
  setMode: () => {},
});

export const ThemeModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useLocalStorage<"light" | "dark">("theme-mode", "dark");

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = useMemo(
    () => (mode === "dark" ? darkTheme : lightTheme),
    [mode]
  );

  if (!mounted) {
    return null;
  }

  return (
    <ThemeModeContext.Provider value={{ mode, setMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
