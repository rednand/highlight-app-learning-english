import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import QuizClient from "../app/(app)/grammar/quiz/[slug]/quiz-client"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("../app/actions/grammar", () => ({
  saveQuizResult: vi.fn().mockResolvedValue(undefined),
}))

const QUESTIONS = [
  {
    q: "Which is correct?",
    options: ["She don't like.", "She doesn't likes.", "She doesn't like.", "She isn't like."],
    answer: 2,
    tip: "Use doesn't + base verb.",
  },
  {
    q: "Simple Present is used for:",
    options: ["Right now", "Habits", "Past", "Future"],
    answer: 1,
    tip: "Habits and general truths.",
  },
  {
    q: "Choose the correct question:",
    options: ["Do he play?", "Does he plays?", "Does he play?", "Is he play?"],
    answer: 2,
    tip: "Does + subject + base verb.",
  },
]

function renderQuiz(previousBest = null) {
  return render(
    <QuizClient
      slug="simple-present"
      title="Simple Present"
      questions={QUESTIONS}
      previousBest={previousBest}
    />,
  )
}

describe("QuizClient", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renderiza a primeira questão e as opções", () => {
    renderQuiz()
    expect(screen.getByText("Which is correct?")).toBeInTheDocument()
    expect(screen.getByText("She don't like.")).toBeInTheDocument()
    expect(screen.getByText("She doesn't like.")).toBeInTheDocument()
    expect(screen.getByText("Questão 1 de 3")).toBeInTheDocument()
  })

  it("não avança sem selecionar uma resposta", () => {
    renderQuiz()
    expect(screen.queryByText("Próxima")).not.toBeInTheDocument()
  })

  it("selecionar resposta correta exibe feedback verde", () => {
    renderQuiz()
    fireEvent.click(screen.getByText("She doesn't like."))
    expect(screen.getByText("Correto!")).toBeInTheDocument()
  })

  it("selecionar resposta errada exibe feedback vermelho com dica", () => {
    renderQuiz()
    fireEvent.click(screen.getByText("She don't like."))
    expect(screen.getByText("Errado!")).toBeInTheDocument()
    expect(screen.getByText("Use doesn't + base verb.")).toBeInTheDocument()
  })

  it("após responder, exibe o botão Próxima", () => {
    renderQuiz()
    fireEvent.click(screen.getByText("She doesn't like."))
    expect(screen.getByText("Próxima")).toBeInTheDocument()
  })

  it("não permite trocar a resposta após selecionar", () => {
    renderQuiz()
    fireEvent.click(screen.getByText("She don't like."))
    fireEvent.click(screen.getByText("She doesn't like."))
    expect(screen.getByText("Errado!")).toBeInTheDocument()
  })

  it("avança para a segunda questão ao clicar Próxima", () => {
    renderQuiz()
    fireEvent.click(screen.getByText("She doesn't like."))
    fireEvent.click(screen.getByText("Próxima"))
    expect(screen.getByText("Simple Present is used for:")).toBeInTheDocument()
    expect(screen.getByText("Questão 2 de 3")).toBeInTheDocument()
  })

  it("exibe tela de resultado ao concluir todas as questões", async () => {
    renderQuiz()

    fireEvent.click(screen.getByText("She doesn't like."))
    fireEvent.click(screen.getByText("Próxima"))

    fireEvent.click(screen.getByText("Habits"))
    fireEvent.click(screen.getByText("Próxima"))

    fireEvent.click(screen.getByText("Does he play?"))
    fireEvent.click(screen.getByText("Ver resultado"))

    await waitFor(() => {
      expect(screen.getByText("3/3 corretas")).toBeInTheDocument()
    })
    expect(screen.getByText("100% de aproveitamento")).toBeInTheDocument()
    expect(screen.getByText("Perfeito! Você domina esse tópico.")).toBeInTheDocument()
  })

  it("resultado parcial exibe mensagem de bom resultado (≥66%)", async () => {
    renderQuiz()

    fireEvent.click(screen.getByText("She doesn't like."))
    fireEvent.click(screen.getByText("Próxima"))

    fireEvent.click(screen.getByText("Habits"))
    fireEvent.click(screen.getByText("Próxima"))

    fireEvent.click(screen.getByText("Do he play?"))
    fireEvent.click(screen.getByText("Ver resultado"))

    await waitFor(() => {
      expect(screen.getByText("2/3 corretas")).toBeInTheDocument()
    })
    expect(screen.getByText("Bom resultado! Revise os erros para fixar.")).toBeInTheDocument()
  })

  it("resultado abaixo de 66% exibe mensagem de revisão", async () => {
    renderQuiz()

    fireEvent.click(screen.getByText("She don't like."))
    fireEvent.click(screen.getByText("Próxima"))

    fireEvent.click(screen.getByText("Right now"))
    fireEvent.click(screen.getByText("Próxima"))

    fireEvent.click(screen.getByText("Do he play?"))
    fireEvent.click(screen.getByText("Ver resultado"))

    await waitFor(() => {
      expect(screen.getByText("0/3 corretas")).toBeInTheDocument()
    })
    expect(screen.getByText("Vale revisar a regra e tentar novamente.")).toBeInTheDocument()
  })

  it("exibe melhor pontuação anterior quando passada", async () => {
    renderQuiz({ correct: 4, total: 5 })
    fireEvent.click(screen.getByText("She doesn't like."))
    fireEvent.click(screen.getByText("Próxima"))
    fireEvent.click(screen.getByText("Habits"))
    fireEvent.click(screen.getByText("Próxima"))
    fireEvent.click(screen.getByText("Does he play?"))
    fireEvent.click(screen.getByText("Ver resultado"))
    await waitFor(() => {
      expect(screen.getByText(/Melhor anterior/)).toBeInTheDocument()
    })
  })

  it("botão Tentar novamente reinicia o quiz", async () => {
    renderQuiz()
    fireEvent.click(screen.getByText("She doesn't like."))
    fireEvent.click(screen.getByText("Próxima"))
    fireEvent.click(screen.getByText("Habits"))
    fireEvent.click(screen.getByText("Próxima"))
    fireEvent.click(screen.getByText("Does he play?"))
    fireEvent.click(screen.getByText("Ver resultado"))

    await waitFor(() => screen.getByText("Tentar novamente"))
    fireEvent.click(screen.getByText("Tentar novamente"))

    expect(screen.getByText("Which is correct?")).toBeInTheDocument()
    expect(screen.getByText("Questão 1 de 3")).toBeInTheDocument()
  })
})
