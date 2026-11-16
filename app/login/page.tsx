import type { Metadata } from "next"
import LoginClient from "./login-client"

export const metadata: Metadata = {
  title: "Entrar - Highlight",
  description: "Entre no Highlight e aprenda inglês com filmes, séries, músicas e livros.",
  alternates: { canonical: "/login" },
}

export default function LoginPage() {
  return <LoginClient />
}
