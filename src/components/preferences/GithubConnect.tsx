"use client";

import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { GithubInstallationResponse } from "@/lib/api/types";
import { FiGithub, FiExternalLink, FiPlus, FiTrash2 } from "react-icons/fi";

const GithubConnect: React.FC = () => {
  const { client } = useApi();
  const [installations, setInstallations] = useState<GithubInstallationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);
  const GITHUB_INSTALL_URL = `https://github.com/apps/${process.env.NEXT_PUBLIC_APP_ID || "flotio-app"}/installations/new`;

  const fetchInstallations = async () => {
    setLoading(true);
    try {
      const data = await client.github.checkInstallation();
      if (data && data.installation_id) {
        setInstallations([data]);
      } else {
        setInstallations([]);
      }
    } catch {
      setInstallations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallations();
  }, [client]);

  const handleConnect = () => {
    window.open(GITHUB_INSTALL_URL, "_blank");
  };

  const handleDisconnect = async (installationId?: number) => {
    setDisconnectingId(installationId ?? 0);
    try {
      await client.github.disconnect(installationId);
      await fetchInstallations();
    } catch (err) {
      console.error("Error disconnecting GitHub:", err);
    } finally {
      setDisconnectingId(null);
    }
  };

  const isConnected = installations.length > 0;

  return (
    <Card className="p-0 overflow-hidden mb-6 border-zinc-800 bg-zinc-950">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <FiGithub className="h-4 w-4 text-cyan-400" />
          <CardTitle>GitHub Integration & Organizations</CardTitle>
        </div>

        {!loading && (
          <Badge
            variant={isConnected ? "success" : "neutral"}
            size="sm"
            dot={isConnected}
          >
            {isConnected ? `${installations.length} Linked` : "Disconnected"}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-semibold text-zinc-100">
              {isConnected ? "Connected GitHub Accounts & Organizations" : "Connect GitHub Account"}
            </h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-md">
              Authorize Flotio to fetch private repositories, listen to webhook events, and trigger automated builds on push across your personal and organizational accounts.
            </p>
          </div>

          <div className="shrink-0">
            {loading ? (
              <Button variant="secondary" size="sm" isLoading disabled>
                Checking...
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FiGithub className="h-3.5 w-3.5" />}
                rightIcon={<FiExternalLink className="h-3 w-3" />}
                onClick={handleConnect}
              >
                {isConnected ? "Link Another Account / Org" : "Connect GitHub"}
              </Button>
            )}
          </div>
        </div>

        {/* Linked Accounts List */}
        {isConnected && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800 overflow-hidden">
            {installations.map((inst) => (
              <div
                key={inst.installation_id}
                className="p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {inst.avatar_url ? (
                    <img
                      src={inst.avatar_url}
                      alt={inst.account_login}
                      className="h-7 w-7 rounded-full bg-zinc-800 shrink-0"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                      <FiGithub className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-100 font-mono">
                        @{inst.account_login}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {inst.account_type || "Account"}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      Installation ID: {inst.installation_id}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={disconnectingId === inst.installation_id}
                  onClick={() => handleDisconnect(inst.installation_id)}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                  leftIcon={<FiTrash2 className="h-3.5 w-3.5" />}
                >
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GithubConnect;
