import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Excluir conta - Highlight",
  description: "Como excluir sua conta e seus dados do Highlight.",
}

export default function AccountDeletionPage() {
  const contactEmail = process.env.PRIVACY_CONTACT_EMAIL

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <Image
            src="/highlight-icon.png"
            alt="Highlight"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-bold tracking-tight text-white">
            Highlight
          </span>
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-white">
          Excluir conta e dados
        </h1>

        <div className="space-y-6 text-sm leading-relaxed text-gray-400">
          <section>
            <h2 className="mb-2 text-base font-semibold text-white">
              Pelo aplicativo
            </h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Entre no Highlight com sua conta Google.</li>
              <li>Abra a página Conta (menu Mais no celular, ou toque no seu e-mail no menu lateral).</li>
              <li>Digite EXCLUIR e toque em Excluir minha conta.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">
              O que é apagado
            </h2>
            <p>
              Sua conta, aulas, palavras, flashcards, progresso de revisão,
              estatísticas e inscrições de notificação. A exclusão é imediata e
              permanente.
            </p>
          </section>

          {contactEmail ? (
            <section>
              <h2 className="mb-2 text-base font-semibold text-white">
                Sem acesso ao app
              </h2>
              <p>
                Envie a solicitação, a partir do e-mail cadastrado, para{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-yellow-400 hover:underline"
                >
                  {contactEmail}
                </a>
                . Os dados são removidos em até 30 dias.
              </p>
            </section>
          ) : null}

          <p>
            Veja também a{" "}
            <Link href="/privacy" className="text-yellow-400 hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
