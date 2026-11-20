import { AlertCircle } from "lucide-react";

export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-rose-300/70 bg-rose-50 p-3 text-xs leading-5 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
