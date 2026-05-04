"use client";
import { createClient } from "../../utils/supabase/client"; // Importe o novo cliente
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  }, [router, supabase]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Redireciona para a rota que você criou para trocar o código pela sessão
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1>Entrar</h1>
      <button
        onClick={handleLogin}
        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        Entrar com Google
      </button>
    </main>
  );
}
