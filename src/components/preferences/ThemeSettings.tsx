"use client";
import React, { useContext, useState } from "react";
import { ThemeModeContext } from "./ThemeModeProvider";

export default function ThemeSettings() {
  const { mode, setMode } = useContext(ThemeModeContext);
  const [sync, setSync] = useState(true);

  return (
    <section className="bg-[#181828] rounded-xl p-8 mb-8 shadow border border-[#23233a]">
      <h2 className="text-lg font-semibold text-white mb-1">Theme & appearance</h2>
      <p className="text-sm text-gray-400 mb-6">Choisissez entre le thème clair et sombre pour l'interface de Veloce.</p>
      <div className="mb-6">
        <label className="block text-xs text-gray-400 mb-2">Mode d'affichage</label>
        <div className="flex gap-4">
          <button
            type="button"
            className={`flex-1 rounded p-4 border text-left ${mode === "light" ? "bg-[#23233a] border-purple-600 text-white" : "bg-[#23233a] border-[#23233a] text-gray-400"}`}
            onClick={() => setMode("light")}
          >
            <div className="font-medium mb-1">Light</div>
            <div className="text-xs">Interface claire, adaptée aux environnements lumineux.</div>
          </button>
          <button
            type="button"
            className={`flex-1 rounded p-4 border text-left ${mode === "dark" ? "bg-[#23233a] border-purple-600 text-white" : "bg-[#23233a] border-[#23233a] text-gray-400"}`}
            onClick={() => setMode("dark")}
          >
            <div className="font-medium mb-1">Dark</div>
            <div className="text-xs">Interface sombre avec accents violets <span className="ml-1 text-purple-400">(recommandé)</span>.</div>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-xs text-gray-400">Synchroniser avec le système</span>
          <label className="relative inline-flex items-center cursor-pointer ml-2">
            <input type="checkbox" checked={sync} onChange={() => setSync(!sync)} className="sr-only peer" />
            <div className="w-11 h-6 bg-[#23233a] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-600 rounded-full peer dark:bg-gray-700 peer-checked:bg-purple-600 transition"></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
          </label>
        </div>
      </div>
    </section>
  );
}
