"use client";

import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FiGithub, FiCheckCircle, FiXCircle, FiExternalLink } from "react-icons/fi";

const GithubConnect: React.FC = () => {
  const { client } = useApi();
  const [hasInstallation, setHasInstallation] = useState<boolean | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const GITHUB_INSTALL_URL = `https://github.com/apps/${process.env.NEXT_PUBLIC_APP_ID}/installations/new`;

  useEffect(() => {
    const checkInstallation = async () => {
      try {
        const data = await client.github.checkInstallation();
        setHasInstallation(Boolean(data.installation_id));
      } catch {
        setHasInstallation(false);
      }
    };
    checkInstallation();
  }, [client]);

  const handleConnect = () => {
    window.location.href = GITHUB_INSTALL_URL;
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await client.github.disconnect();
      setHasInstallation(false);
    } catch (err) {
      console.error("Error disconnecting GitHub:", err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card className="p-0 overflow-hidden mb-6 border-zinc-800 bg-zinc-950">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <FiGithub className="h-4 w-4 text-cyan-400" />
          <CardTitle>GitHub Integration</CardTitle>
        </div>

        {hasInstallation !== null && (
          <Badge
            variant={hasInstallation ? "success" : "neutral"}
            size="sm"
            dot={hasInstallation}
          >
            {hasInstallation ? "Connected" : "Disconnected"}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-semibold text-zinc-100">
            {hasInstallation ? "GitHub App Active" : "Connect GitHub Account"}
          </h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-md">
            Authorize Flotio to fetch private repositories, webhook events, and trigger automated builds on push.
          </p>
        </div>

        <div>
          {hasInstallation === null ? (
            <Button variant="secondary" size="sm" isLoading disabled>
              Checking...
            </Button>
          ) : hasInstallation ? (
            <Button
              variant="danger"
              size="sm"
              isLoading={isDisconnecting}
              onClick={handleDisconnect}
            >
              Disconnect Account
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FiGithub className="h-3.5 w-3.5" />}
              rightIcon={<FiExternalLink className="h-3 w-3" />}
              onClick={handleConnect}
            >
              Connect GitHub
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GithubConnect;
