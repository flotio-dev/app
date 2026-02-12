"use client";
import SideMenu from '@/components/common/SideMenu';
import NewProjectHeader from '@/components/newProject/NewProjectHeader';
import NewProjectForm from '@/components/newProject/NewProjectForm';
import { useTheme } from '@mui/material/styles';

export default function NewProjectPage() {
  const theme = useTheme();
  return (
    <div className="min-h-screen flex" style={{ background: theme.palette.background.default }}>
      <div className="fixed left-0 top-0 h-screen w-64 z-30">
        <SideMenu />
      </div>
      <main className="flex-1 flex flex-col min-h-screen" style={{ paddingLeft: 256 }}>
        <header className="h-16 flex items-center px-6" style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <NewProjectHeader />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-8" style={{ background: theme.palette.background.default }}>
          <NewProjectForm />
        </div>
      </main>
    </div>
  );
}
