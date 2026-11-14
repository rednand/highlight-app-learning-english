# Workflow

- Antes de finalizar qualquer tarefa: rode `npm run lint` e corrija todos os erros.
- Atualize `TASK.md` a cada etapa concluída.
- Execute `/review` antes de criar um pull request.
- Só prossiga com `gh pr create` após o review estar completo e problemas críticos resolvidos.
- Merge automático autorizado: depois de abrir um PR, faça o merge você mesmo se todas as condições abaixo forem atendidas. Se alguma falhar, não faça o merge e avise o usuário com o motivo.
  - `/review` sem problemas críticos pendentes
  - `npm run lint` sem erros
  - `npm run test:coverage` passando (cobertura mínima de 80%)
  - `npm run build` concluído
- Depois de cada merge, diga ao usuário o que foi para produção e o que testar no celular.
- sempre use o usuario "rednand" para mandar para o github, nunca use o usuario "claude" para mandar para o github. O usuario "claude" é apenas para testes locais, e não tem acesso ao github. O usuario "rednand" é o unico que tem acesso ao github, e deve ser usado para todas as interações com o github.