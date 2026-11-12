import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidade - Highlight",
  description: "Como o Highlight coleta, usa e protege seus dados.",
}

const UPDATED_AT = "11 de novembro de 2026"

const sections: { title: string; body: string[] }[] = [
  {
    title: "Dados que coletamos",
    body: [
      "Ao entrar com sua conta Google, recebemos seu nome, e-mail e foto de perfil. Não temos acesso à sua senha do Google.",
      "Guardamos o conteúdo que você cria no app: aulas, filmes, séries, músicas e livros, palavras e expressões, traduções, frases de exemplo, flashcards e o seu progresso de revisão.",
      "Se você ativar as notificações, guardamos o identificador de inscrição push do seu navegador ou dispositivo para enviar lembretes diários de revisão.",
      "Seu progresso no roadmap e a sessão de filme em andamento ficam salvos apenas no armazenamento local do seu dispositivo.",
    ],
  },
  {
    title: "Como usamos os dados",
    body: [
      "Usamos os dados para autenticar você, exibir suas aulas, mídias e flashcards, calcular as próximas revisões e enviar os lembretes que você ativou.",
      "Não vendemos seus dados, não os usamos para publicidade e não os compartilhamos com terceiros para fins de marketing.",
    ],
  },
  {
    title: "Serviços de terceiros",
    body: [
      "Hospedagem e banco de dados: Vercel e Supabase, que armazenam e processam seus dados em nosso nome.",
      "Login: Google OAuth.",
      "Monitoramento de erros: Sentry, que pode receber informações técnicas sobre falhas do app.",
      "Consultas de conteúdo: MyMemory (tradução), Dictionary API (fonética), Tatoeba (frases de exemplo), TMDB (filmes), Open Library e Google Books (livros). Nessas consultas enviamos apenas o termo pesquisado, sem identificar você.",
    ],
  },
  {
    title: "Armazenamento e segurança",
    body: [
      "Os dados são transmitidos por HTTPS e protegidos por regras de acesso por usuário no banco de dados, de modo que cada pessoa só acessa o que é seu.",
    ],
  },
  {
    title: "Exclusão de dados",
    body: [
      "Você pode excluir aulas, mídias e palavras diretamente no app.",
      "Você pode excluir sua conta e todos os dados associados a ela a qualquer momento na página Conta do app. A exclusão é imediata e permanente.",
      "Se não conseguir acessar o app, envie uma solicitação pelo contato indicado abaixo, a partir do e-mail cadastrado. Removemos os dados em até 30 dias.",
    ],
  },
  {
    title: "Crianças",
    body: [
      "O Highlight não é direcionado a menores de 13 anos e não coletamos intencionalmente dados dessa faixa etária.",
    ],
  },
  {
    title: "Alterações nesta política",
    body: [
      "Podemos atualizar esta política periodicamente. A data da última atualização aparece no topo desta página.",
    ],
  },
]

export default function PrivacyPage() {
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

        <h1 className="mb-1 text-2xl font-bold text-white">
          Política de Privacidade
        </h1>
        <p className="mb-8 text-sm text-gray-500">
          Última atualização: {UPDATED_AT}
        </p>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-base font-semibold text-white">
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-gray-400">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          {contactEmail ? (
            <section>
              <h2 className="mb-2 text-base font-semibold text-white">
                Contato
              </h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Dúvidas ou solicitações sobre seus dados:{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-yellow-400 hover:underline"
                >
                  {contactEmail}
                </a>
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
