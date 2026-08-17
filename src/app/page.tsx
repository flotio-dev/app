"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthContext";

export default function RootPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();

  useEffect(() => {
    if (accessToken || user) {
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [user, accessToken, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 animate-pulse" />
        <p className="text-xs text-zinc-500 font-mono">Loading Flotio...</p>
      </div>
    </div>
  );
}
