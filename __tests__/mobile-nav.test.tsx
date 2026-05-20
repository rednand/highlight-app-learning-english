import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import MobileNav from "../app/(app)/mobile-nav"

const mockPathname = vi.fn().mockReturnValue("/")

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}))

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe("MobileNav", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/")
    vi.clearAllMocks()
  })

  it("renderiza os 5 links principais", () => {
    render(<MobileNav />)
    expect(screen.getByText("Início")).toBeInTheDocument()
    expect(screen.getByText("Aulas")).toBeInTheDocument()
    expect(screen.getByText("Mídia")).toBeInTheDocument()
    expect(screen.getByText("Gramática")).toBeInTheDocument()
    expect(screen.getByText("Revisar")).toBeInTheDocument()
  })

  it("renderiza o botão Mais", () => {
    render(<MobileNav />)
    expect(screen.getByText("Mais")).toBeInTheDocument()
  })

  it("menu de Mais começa fechado", () => {
    render(<MobileNav />)
    expect(screen.queryByText("Trilha")).not.toBeInTheDocument()
  })

  it("clicar em Mais abre o menu com Trilha", () => {
    render(<MobileNav />)
    fireEvent.click(screen.getByText("Mais"))
    expect(screen.getByText("Trilha")).toBeInTheDocument()
  })

  it("clicar no overlay fecha o menu", () => {
    render(<MobileNav />)
    fireEvent.click(screen.getByText("Mais"))
    expect(screen.getByText("Trilha")).toBeInTheDocument()

    const overlay = document.querySelector(".fixed.inset-0")!
    fireEvent.click(overlay)
    expect(screen.queryByText("Trilha")).not.toBeInTheDocument()
  })

  it("clicar no botão X fecha o menu", () => {
    render(<MobileNav />)
    fireEvent.click(screen.getByText("Mais"))
    const closeBtn = screen.getByRole("button", { name: "" })
    fireEvent.click(closeBtn)
    expect(screen.queryByText("Trilha")).not.toBeInTheDocument()
  })

  it("Início ativo quando pathname é '/'", () => {
    mockPathname.mockReturnValue("/")
    render(<MobileNav />)
    const link = screen.getByText("Início").closest("a")
    expect(link).toHaveClass("text-yellow-400")
  })

  it("Aulas ativo quando pathname começa com /lessons", () => {
    mockPathname.mockReturnValue("/lessons")
    render(<MobileNav />)
    const link = screen.getByText("Aulas").closest("a")
    expect(link).toHaveClass("text-yellow-400")
  })

  it("Revisar ativo quando pathname começa com /review", () => {
    mockPathname.mockReturnValue("/review")
    render(<MobileNav />)
    const link = screen.getByText("Revisar").closest("a")
    expect(link).toHaveClass("text-yellow-400")
  })

  it("Início não ativo em outras rotas", () => {
    mockPathname.mockReturnValue("/lessons")
    render(<MobileNav />)
    const link = screen.getByText("Início").closest("a")
    expect(link).not.toHaveClass("text-yellow-400")
  })

  it("clicar em link do menu Mais fecha o menu", () => {
    render(<MobileNav />)
    fireEvent.click(screen.getByText("Mais"))
    expect(screen.getByText("Trilha")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Trilha"))
    expect(screen.queryByText("Trilha")).not.toBeInTheDocument()
  })
})
