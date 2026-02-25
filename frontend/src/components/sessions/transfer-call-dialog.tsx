"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Transfer, TransferType } from "@/lib/api";

function PhoneIcon({ className }: { className?: string }) {
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
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  );
}

interface TransferCallDialogProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferInitiated: (transfer: Transfer) => void;
}

export function TransferCallDialog({
  sessionId,
  open,
  onOpenChange,
  onTransferInitiated,
}: TransferCallDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transferType, setTransferType] = useState<TransferType>("cold");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidPhone = /^\+?[\d\s\-()]{7,}$/.test(phoneNumber.trim());

  async function handleTransfer() {
    if (!isValidPhone) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const response = await fetch(`${apiUrl}/sessions/${sessionId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber.trim(),
          transfer_type: transferType,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || "Failed to initiate transfer");
      }

      const transfer: Transfer = await response.json();
      onTransferInitiated(transfer);
      onOpenChange(false);
      setPhoneNumber("");
      setTransferType("cold");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate transfer");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneIcon className="h-5 w-5" />
            Transfer Call
          </DialogTitle>
          <DialogDescription>
            Transfer this active call to another phone number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Phone Number</Label>
            <Input
              id="phone-number"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setError(null);
              }}
              aria-invalid={phoneNumber.length > 0 && !isValidPhone}
            />
            {phoneNumber.length > 0 && !isValidPhone && (
              <p className="text-xs text-destructive">
                Enter a valid phone number
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="transfer-type" className="text-sm font-medium">
                Warm Transfer
              </Label>
              <p className="text-xs text-muted-foreground">
                {transferType === "warm"
                  ? "Stay on line until the other party answers"
                  : "Disconnect immediately after connecting"}
              </p>
            </div>
            <Switch
              id="transfer-type"
              checked={transferType === "warm"}
              onCheckedChange={(checked) =>
                setTransferType(checked ? "warm" : "cold")
              }
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!isValidPhone || isSubmitting}
          >
            {isSubmitting ? "Transferring..." : "Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
