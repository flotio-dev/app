"use client";

import PreferencesHeader from "@/components/preferences/PreferencesHeader";
import SideMenu from "@/components/common/SideMenu";
import ProfileSettings from "@/components/preferences/ProfileSettings";
import GithubConnect from "@/components/preferences/GithubConnect";
import ThemeSettings from "@/components/preferences/ThemeSettings";
import { ThemeModeProvider } from "@/components/preferences/ThemeModeProvider";
import { useTheme } from "@mui/material/styles";

export default function PreferencesPage() {
  const theme = useTheme();
  return (
    <ThemeModeProvider>
      <div className="min-h-screen flex">
        <div className="fixed left-0 top-0 h-screen w-64 z-30">
          <SideMenu />
        </div>
        <main className="flex-1 flex flex-col min-h-screen" style={{ paddingLeft: 256 }}>
          <header className="h-16 flex items-center px-6" style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
            <PreferencesHeader />
          </header>
          <div className="py-10 px-8">
            <ProfileSettings />
            <GithubConnect />
            <ThemeSettings />
          </div>
        </main>
      </div>
    </ThemeModeProvider>
  );
}
