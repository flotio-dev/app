"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useApi } from '@/hooks/useApi';

export default function GithubSetupContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { client } = useApi();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Initialisation...");

    useEffect(() => {
        const installationId = searchParams.get("installation_id");
        const setupAction = searchParams.get("setup_action");

        if (!installationId || isNaN(Number(installationId))) {
            setStatus("error");
            setMessage("Aucun ID d'installation valide trouvé dans l'URL.");
            return;
        }

        const linkGithub = async () => {
            try {
                await client.github.postInstallation(Number(installationId));
                setStatus("success");
                if (setupAction === "update") {
                  setMessage("Mise à jour réussie ! Votre compte GitHub est synchronisé avec Flotio.");
                } else {
                  setMessage("Installation réussie ! Votre compte GitHub est maintenant lié à Flotio");
                }
                setTimeout(() => router.push("/dashboard"), 2000);
            } catch (err) {
                setStatus("error");
                const errorMessage = err instanceof Error ? err.message : "Erreur lors de la liaison de votre compte GitHub.";
                setMessage(errorMessage || "Impossible de contacter le serveur. Réessayez plus tard.");
            }
        };

        linkGithub();
    }, [searchParams, router, client]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-purple-600 to-indigo-700 text-white text-center px-4">
            {status === "loading" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h1 className="text-2xl font-semibold">Connexion à GitHub...</h1>
                    <p className="mt-2 text-white/80">{message}</p>
                </motion.div>
            )}

            {status === "success" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-3xl font-bold mb-2">Installation réussie</h1>
                    <p className="text-white/80">{message}</p>
                </motion.div>
            )}

            {status === "error" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-3xl font-bold mb-2">Erreur</h1>
                    <p className="text-white/80">{message}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="mt-6 px-6 py-2 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition"
                    >
                        Retour à l’accueil
                    </button>
                </motion.div>
            )}
        </div>
    );
}