"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Transfer, TransferStatus as TStatus } from "@/lib/api";

const STATUS_CONFIG: Record<
  TStatus,
  { label: string; className: string; pulse: boolean }
> = {
  initiating: {
    label: "Initiating",
    className: "border-blue-500 text-blue-600 bg-blue-500/10",
    pulse: true,
  },
  ringing: {
    label: "Ringing",
    className: "border-amber-500 text-amber-600 bg-amber-500/10",
    pulse: true,
  },
  connected: {
    label: "Connected",
    className: "border-emerald-500 text-emerald-600 bg-emerald-500/10",
    pulse: true,
  },
  completed: {
    label: "Completed",
    className: "border-emerald-500 text-emerald-600 bg-emerald-500/10",
    pulse: false,
  },
  failed: {
    label: "Failed",
    className: "border-red-500 text-red-600 bg-red-500/10",
    pulse: false,
  },
};

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

interface TransferStatusIndicatorProps {
  transfer: Transfer;
  sessionId: string;
  onStatusChange?: (transfer: Transfer) => void;
}

export function TransferStatusIndicator({
  transfer,
  sessionId,
  onStatusChange,
}: TransferStatusIndicatorProps) {
  const [current, setCurrent] = useState<Transfer>(transfer);

  useEffect(() => {
    setCurrent(transfer);
  }, [transfer]);

  // Poll for status updates on in-progress transfers
  useEffect(() => {
    const isTerminal =
      current.status === "completed" || current.status === "failed";
    if (isTerminal) return;

    const interval = setInterval(async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const response = await fetch(
          `${apiUrl}/sessions/${sessionId}/transfers`
        );
        if (!response.ok) return;

        const transfers: Transfer[] = await response.json();
        const updated = transfers.find((t) => t.id === current.id);
        if (updated && updated.status !== current.status) {
          setCurrent(updated);
          onStatusChange?.(updated);
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [current.id, current.status, sessionId, onStatusChange]);

  const config = STATUS_CONFIG[current.status];

  return (
    <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/30">
      <PhoneForwardIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">
            Transfer to {current.phone_number}
          </span>
          <Badge variant="outline" className={config.className}>
            {config.pulse && (
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            )}
            {config.label}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {current.transfer_type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(current.initiated_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
