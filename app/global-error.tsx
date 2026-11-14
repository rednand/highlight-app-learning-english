"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-page">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">Algo deu errado</h2>
          <p className="mt-2 text-sm text-fg-muted">O erro foi registrado automaticamente.</p>
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-black hover:bg-brand-strong"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
