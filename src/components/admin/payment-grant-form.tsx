"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ApiClientError, apiPost } from "@/lib/api-client";
import {
  ADVANCED_SQL,
  BUNDLE_PRICE_BDT,
  MODULE_PRICE_BDT,
  PAID_MODULES,
} from "@/lib/learning/payments";

const GRANT_OPTIONS = [
  {
    value: "BUNDLE",
    label: `All 5 premium modules (৳${BUNDLE_PRICE_BDT} value)`,
  },
  ...PAID_MODULES.map((module) => ({
    value: module.slug,
    label: `Module ${module.order}: ${module.title} (৳${MODULE_PRICE_BDT})`,
  })),
  {
    value: ADVANCED_SQL.slug,
    label: `Advanced SQL (৳${ADVANCED_SQL.priceBdt})`,
  },
];

export function PaymentGrantForm() {
  const [grantUser, setGrantUser] = useState("");
  const [grantProduct, setGrantProduct] = useState("BUNDLE");
  const [granting, setGranting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grant = async () => {
    if (granting || grantUser.trim().length < 3) return;
    setGranting(true);
    setMessage(null);
    setError(null);
    try {
      const payload =
        grantProduct === "BUNDLE"
          ? { product: "BUNDLE" as const, moduleSlug: null }
          : { product: "MODULE" as const, moduleSlug: grantProduct };
      const result = await apiPost<{ modules: string[]; granted: number }>(
        "/api/v1/admin/entitlements",
        { username: grantUser.trim(), ...payload },
      );
      setMessage(
        `Granted ${result.granted} module${result.granted === 1 ? "" : "s"} to @${grantUser.trim()}.`,
      );
      setGrantUser("");
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not grant access.",
      );
    } finally {
      setGranting(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Grant free access</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Scholarship/manual unlock without a payment. {PAID_MODULES.length}{" "}
        premium modules are available.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.2fr_auto] sm:items-end">
        <div>
          <label className="text-xs font-medium" htmlFor="grant-user">
            Username
          </label>
          <Input
            id="grant-user"
            value={grantUser}
            onChange={(event) => setGrantUser(event.target.value)}
            placeholder="coder123"
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-xs font-medium" htmlFor="grant-product">
            Access
          </label>
          <SearchableSelect
            id="grant-product"
            options={GRANT_OPTIONS}
            value={grantProduct}
            onValueChange={setGrantProduct}
            className="mt-1.5"
          />
        </div>
        <Button
          type="button"
          onClick={() => void grant()}
          disabled={granting || grantUser.trim().length < 3}
        >
          {granting ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Grant
        </Button>
      </div>
      {message ? (
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
