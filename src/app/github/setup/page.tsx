"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import FlotioLogo from "@/components/common/FlotioLogo";
import {
  FiGithub,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiRefreshCw,
  FiXCircle,
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
      setMessage("Aucun identifiant d'installation GitHub valide n'a été fourni.");
      return;
    }

    setStatus("loading");
    setMessage("Enregistrement de l'autorisation GitHub...");

    try {
      await client.github.postInstallation(Number(installationId));
      setStatus("success");
      setMessage(
        setupAction === "update"
          ? "Vos autorisations et dépôts GitHub ont été synchronisés avec succès !"
          : "Votre compte GitHub a été associé avec succès à votre organisation Flotio."
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
              // fallback if popup blocker prevents window.close
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
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-[#ff6b4a]/20 via-[#ff5722]/15 to-[#e11d48]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#151923_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-[#0f1219]/90 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center"
      >
        {/* Top Logo & App Connection Indicator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
            <FiGithub className="h-6 w-6 text-white" />
          </div>
          <div className="h-0.5 w-8 bg-gradient-to-r from-white/20 via-[#ff5722] to-white/20 relative">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#ff5722] animate-ping" />
          </div>
          <div className="h-12 w-12 rounded-xl bg-[#ff5722]/10 border border-[#ff5722]/30 flex items-center justify-center shadow-lg shadow-[#ff5722]/10">
            <FlotioLogo size={28} />
          </div>
        </div>

        {/* Dynamic Status Sections */}
        {status === "loading" && (
          <div className="space-y-4 py-2">
            <div className="inline-flex p-3 rounded-full bg-[#ff5722]/10 border border-[#ff5722]/20">
              <FiRefreshCw className="h-6 w-6 text-[#ff5722] animate-spin" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Connexion à GitHub...
            </h1>
            <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              {message}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-5 py-2">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FiCheckCircle className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Synchronisation réussie !
              </h1>
              <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                {message}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {isPopup
                  ? `Fermeture automatique dans ${countdown}s...`
                  : `Redirection vers la console dans ${countdown}s...`}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseOrNavigate}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#ff5722] text-white font-medium text-sm hover:opacity-95 shadow-lg shadow-[#ff5722]/25 transition cursor-pointer"
              >
                <span>{isPopup ? "Fermer maintenant" : "Accéder au tableau de bord"}</span>
                <FiArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-5 py-2">
            <div className="inline-flex p-3 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <FiAlertCircle className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Liaison impossible
              </h1>
              <p className="text-sm text-rose-300/90 max-w-sm mx-auto leading-relaxed font-mono text-xs bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-left">
                {message}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={linkGithub}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#ff5722] text-white text-xs font-medium hover:bg-[#f4511e] transition cursor-pointer"
              >
                <FiRefreshCw className="h-3.5 w-3.5" />
                <span>Réessayer la synchronisation</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <span>Retour à la console</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}