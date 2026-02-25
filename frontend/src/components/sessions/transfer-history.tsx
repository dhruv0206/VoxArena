"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transfer } from "@/lib/api";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString();
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

interface TransferHistoryProps {
  transfers: Transfer[];
}

export function TransferHistory({ transfers }: TransferHistoryProps) {
  if (transfers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transfers.map((transfer) => (
            <div
              key={transfer.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {transfer.phone_number}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {transfer.transfer_type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      transfer.status === "completed"
                        ? "border-emerald-500 text-emerald-600 bg-emerald-500/10"
                        : transfer.status === "failed"
                          ? "border-red-500 text-red-600 bg-red-500/10"
                          : "border-blue-500 text-blue-600 bg-blue-500/10"
                    }
                  >
                    {transfer.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Initiated at {formatTime(transfer.initiated_at)}
                  {transfer.connected_at &&
                    ` · Connected at ${formatTime(transfer.connected_at)}`}
                  {transfer.completed_at &&
                    ` · Duration ${formatDuration(transfer.initiated_at, transfer.completed_at)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
