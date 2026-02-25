"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TransferCallDialog } from "./transfer-call-dialog";
import { TransferStatusIndicator } from "./transfer-status";
import { TransferHistory } from "./transfer-history";
import type { Transfer } from "@/lib/api";

function PhoneForwardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 3.75v4.5m0-4.5h-4.5m4.5 0l-6 6m3 6.75c0 .414-.168.81-.465 1.1l-2.11 2.11a1.554 1.554 0 01-2.197 0 18.093 18.093 0 01-5.363-5.363 1.554 1.554 0 010-2.197l2.11-2.11a1.554 1.554 0 011.1-.465c.414 0 .81.168 1.1.465l1.414 1.414a1.554 1.554 0 010 2.197"
      />
    </svg>
  );
}

interface TransferControlsProps {
  sessionId: string;
  sessionStatus: string;
}

export function TransferControls({
  sessionId,
  sessionStatus,
}: TransferControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loaded, setLoaded] = useState(false);

  const isActive = sessionStatus === "ACTIVE";

  // Fetch existing transfers
  useEffect(() => {
    async function fetchTransfers() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const response = await fetch(
          `${apiUrl}/sessions/${sessionId}/transfers`
        );
        if (response.ok) {
          const data: Transfer[] = await response.json();
          setTransfers(data);
        }
      } catch {
        // Ignore fetch errors — transfers may not exist yet
      } finally {
        setLoaded(true);
      }
    }
    fetchTransfers();
  }, [sessionId]);

  const handleTransferInitiated = useCallback((transfer: Transfer) => {
    setTransfers((prev) => [transfer, ...prev]);
  }, []);

  const handleStatusChange = useCallback((updated: Transfer) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  }, []);

  if (!loaded) return null;

  const activeTransfer = transfers.find(
    (t) => t.status !== "completed" && t.status !== "failed"
  );
  const completedTransfers = transfers.filter(
    (t) => t.status === "completed" || t.status === "failed"
  );

  const hasContent = isActive || activeTransfer || completedTransfers.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      {/* Transfer button — only for active sessions */}
      {isActive && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          disabled={!!activeTransfer}
        >
          <PhoneForwardIcon className="h-4 w-4 mr-2" />
          {activeTransfer ? "Transfer in Progress" : "Transfer Call"}
        </Button>
      )}

      {/* Active transfer status indicator */}
      {activeTransfer && (
        <TransferStatusIndicator
          transfer={activeTransfer}
          sessionId={sessionId}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Transfer history for completed/failed transfers */}
      {completedTransfers.length > 0 && (
        <TransferHistory transfers={completedTransfers} />
      )}

      {/* Transfer dialog */}
      <TransferCallDialog
        sessionId={sessionId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onTransferInitiated={handleTransferInitiated}
      />
    </div>
  );
}
