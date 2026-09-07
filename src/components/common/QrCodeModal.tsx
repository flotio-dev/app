"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FiDownload, FiCheck, FiCopy, FiSmartphone } from "react-icons/fi";
import { SiAndroid } from "react-icons/si";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl: string;
  title?: string;
  buildId?: string | number;
  versionName?: string;
}

export function QrCodeModal({
  isOpen,
  onClose,
  downloadUrl,
  title = "Install APK on Device",
  buildId,
  versionName,
}: QrCodeModalProps) {
  const [copied, setCopied] = useState(false);

  // Encode URL for public QR generator service
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    downloadUrl
  )}&bgcolor=15-19-23&color=248-250-252&margin=10`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center space-y-4 pt-1 pb-2">
        {/* Android Device Target Callout */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <SiAndroid className="h-3.5 w-3.5 text-[#3DDC84]" />
          <span>Android Live Testing • ARM64 Universal APK</span>
        </div>

        {/* QR Code Container */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeImgSrc}
            alt="Scan to download APK"
            className="w-48 h-48 rounded-lg object-contain"
            loading="lazy"
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Metadata info */}
        <div className="space-y-1">
          <p className="text-xs text-zinc-300 font-medium">
            Scan with your phone camera to download and install
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            {buildId ? `Build #${buildId}` : ""} {versionName ? `• v${versionName}` : ""}
          </p>
        </div>

        {/* Action buttons */}
        <div className="w-full flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={copied ? <FiCheck className="h-3.5 w-3.5 text-emerald-400" /> : <FiCopy className="h-3.5 w-3.5" />}
            onClick={handleCopyLink}
          >
            {copied ? "Link Copied!" : "Copy Link"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<FiDownload className="h-3.5 w-3.5" />}
            onClick={() => window.open(downloadUrl, "_blank")}
          >
            Direct Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default QrCodeModal;
