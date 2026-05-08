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
      <body className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">Algo deu errado</h2>
          <p className="mt-2 text-sm text-gray-400">O erro foi registrado automaticamente.</p>
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-300"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
