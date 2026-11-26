"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

export type ReviewOrder = {
  kind: "PURCHASE" | "FREE_REQUEST";
  amountBdt: number;
  label: string;
  user: { username: string };
};

export function PaymentApproveDialog({
  order,
  onCancel,
  onConfirm,
}: {
  order: ReviewOrder | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isPurchase = order?.kind === "PURCHASE";

  return (
    <ConfirmDialog
      open={order !== null}
      title={isPurchase ? "Approve this payment?" : "Grant free access?"}
      description={
        !order
          ? ""
          : isPurchase
            ? `Confirm the ৳${order.amountBdt} payment from @${order.user.username} for ${order.label}. This unlocks the access immediately.`
            : `Give @${order.user.username} access to ${order.label} without a payment. This unlocks it immediately.`
      }
      confirmLabel="Approve & unlock"
      cancelLabel="Cancel"
      destructive={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

export function PaymentReasonDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: { order: ReviewOrder; action: "REJECT" | "REVOKE" } | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fieldId = useId();
  const errorId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!target) return;
    setReason("");
    setError(null);
  }, [target]);

  const isRevoke = target?.action === "REVOKE";

  const submit = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError("Add a short reason (at least 3 characters).");
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Modal
      open={target !== null}
      title={
        isRevoke
          ? "Revoke this access?"
          : target?.order.kind === "FREE_REQUEST"
            ? "Reject this request?"
            : "Reject this payment?"
      }
      description={
        !target
          ? undefined
          : isRevoke
            ? `@${target.order.user.username} loses access to ${target.order.label} immediately and is notified with your reason.`
            : `No access is granted for ${target.order.label}. @${target.order.user.username} is notified with your reason.`
      }
      onClose={onCancel}
      initialFocusRef={fieldRef}
    >
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="text-xs font-medium">
          Reason
        </label>
        <Textarea
          ref={fieldRef}
          id={fieldId}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setError(null);
          }}
          rows={3}
          maxLength={300}
          placeholder={
            isRevoke
              ? "Why is this access being revoked?"
              : "Why is this being rejected?"
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-[11px] font-medium text-destructive"
          >
            {error}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Saved on the order and included in the user&apos;s notification.
          </p>
        )}
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" size="lg" onClick={submit}>
          <X aria-hidden="true" />
          {isRevoke ? "Revoke access" : "Reject"}
        </Button>
      </div>
    </Modal>
  );
}
