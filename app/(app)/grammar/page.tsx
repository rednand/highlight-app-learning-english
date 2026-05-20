import grammarRules from "../../../data/grammar-rules.json"
import GrammarList from "./grammar-list"
import type { GrammarRule } from "./types"

export default function GrammarPage() {
  return <GrammarList rules={grammarRules as GrammarRule[]} />
}
