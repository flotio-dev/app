"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import FlotioLogo from "@/components/common/FlotioLogo";
import {
  FiGithub,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiRefreshCw,
  FiShield,
  FiCheck,
} from "react-icons/fi";

export default function GithubSetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { client } = useApi();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connexion de votre compte GitHub à Flotio...");
  const [countdown, setCountdown] = useState(3);
  const [isPopup, setIsPopup] = useState(false);

  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");

  const linkGithub = useCallback(async () => {
    if (!installationId || isNaN(Number(installationId))) {
      setStatus("error");
      setMessage("Aucun identifiant d'installation GitHub valide n'a été détecté dans l'URL.");
      return;
    }

    setStatus("loading");
    setMessage("Enregistrement et vérification de l'autorisation GitHub...");

    try {
      await client.github.postInstallation(Number(installationId));
      setStatus("success");
      setMessage(
        setupAction === "update"
          ? "Vos autorisations et dépôts GitHub ont été synchronisés avec succès !"
          : "Votre compte GitHub a été associé avec succès à votre compte Flotio."
      );

      // Notify parent window if opened as popup/blank tab
      if (typeof window !== "undefined" && window.opener) {
        try {
          window.opener.postMessage(
            {
              type: "FLOTIO_GITHUB_LINKED",
              installationId: Number(installationId),
              action: setupAction || "install",
            },
            "*"
          );
        } catch {
          // ignore postMessage errors
        }
      }
    } catch (err) {
      setStatus("error");
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inattendue lors de la liaison GitHub.";
      setMessage(errorMessage);
    }
  }, [installationId, setupAction, client]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.opener) {
      setIsPopup(true);
    }
    linkGithub();
  }, [linkGithub]);

  // Handle countdown and auto-navigation / auto-close on success
  useEffect(() => {
    if (status !== "success") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isPopup && typeof window !== "undefined") {
            try {
              window.close();
            } catch {
              // fallback
            }
          }
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, isPopup, router]);

  const handleCloseOrNavigate = () => {
    if (isPopup && typeof window !== "undefined") {
      try {
        window.close();
      } catch {
        // ignore
      }
    }
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-[#080a0f] text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans">
      {/* Background ambient radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#ff6b4a]/20 via-[#ff5722]/15 to-[#e11d48]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#e11d48]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1c212f_1px,transparent_1px)] [background-size:28px_28px] opacity-35 pointer-events-none" />

      {/* Main glass card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg rounded-3xl bg-[#0f1219]/90 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-center"
      >
        {/* Visual Sync Badge / Pipeline Bridge */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-7">
          <div className="h-14 w-14 rounded-2xl bg-zinc-900/90 border border-zinc-700/60 flex items-center justify-center shadow-lg shadow-black/40">
            <FiGithub className="h-7 w-7 text-white" />
          </div>

          {/* Pulsing Sync Beam */}
          <div className="relative flex items-center px-1">
            <div className="w-10 sm:w-14 h-0.5 bg-gradient-to-r from-zinc-600 via-[#ff5722] to-zinc-600 relative overflow-hidden rounded-full">
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-8 h-full bg-gradient-to-r from-transparent via-white to-transparent"
              />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -top-2 px-1.5 py-0.5 rounded-full bg-[#151923] border border-white/10 text-[9px] font-mono text-[#ff7a50] uppercase tracking-wider">
              Sync
            </div>
          </div>

          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#151923] to-[#0f1219] border border-[#ff5722]/40 flex items-center justify-center shadow-lg shadow-[#ff5722]/15">
            <FlotioLogo size={32} />
          </div>
        </div>

        {/* Dynamic Status Sections */}
        <AnimatePresence mode="wait">
          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 py-2"
            >
              <div className="inline-flex p-3 rounded-full bg-[#ff5722]/10 border border-[#ff5722]/20">
                <FiRefreshCw className="h-6 w-6 text-[#ff5722] animate-spin" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Synchronisation en cours...
              </h1>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                {message}
              </p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <div className="inline-flex p-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1">
                  <FiCheckCircle className="h-7 w-7" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {setupAction === "update" ? "Autorisations Mises à Jour" : "GitHub Associé avec Succès"}
                </h1>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Detailed Summary Metadata Box */}
              <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800/80 p-4 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <FiShield className="h-3.5 w-3.5 text-[#ff5722]" />
                    Installation ID
                  </span>
                  <span className="font-mono font-semibold text-zinc-200">
                    #{installationId || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-400">Action</span>
                  <span className="font-medium text-emerald-400 flex items-center gap-1">
                    <FiCheck className="h-3 w-3" />
                    {setupAction === "update" ? "Mise à jour autorisations" : "Nouvelle connexion"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400">Accès Dépôts</span>
                  <span className="font-medium text-zinc-200">Actif & Prêt pour les Builds</span>
                </div>
              </div>

              {/* Countdown Progress Card */}
              <div className="relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/5 p-3 text-xs text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {isPopup
                      ? `Fermeture de l'onglet dans ${countdown}s...`
                      : `Redirection vers la console dans ${countdown}s...`}
                  </span>
                </div>
                <span className="font-mono font-bold text-[#ff7a50]">{countdown}s</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseOrNavigate}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#ff5722] text-white font-medium text-sm hover:opacity-95 shadow-lg shadow-[#ff5722]/30 transition cursor-pointer"
                >
                  <span>{isPopup ? "Fermer cette fenêtre" : "Aller au tableau de bord"}</span>
                  <FiArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="inline-flex p-3 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <FiAlertCircle className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Échec de la synchronisation
                </h1>
                <p className="text-xs text-rose-300/90 max-w-sm mx-auto leading-relaxed font-mono bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-left">
                  {message}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={linkGithub}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff5722] text-white text-xs font-medium hover:bg-[#f4511e] transition cursor-pointer shadow-md shadow-[#ff5722]/20"
                >
                  <FiRefreshCw className="h-3.5 w-3.5" />
                  <span>Réessayer la synchronisation</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <span>Retour à la console</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}