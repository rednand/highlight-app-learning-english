import grammarRules from "../../../../data/grammar-rules.json"
import PracticeClient from "./practice-client"
import type { GrammarRule } from "../types"

export default function GrammarPracticePage() {
  return <PracticeClient rules={grammarRules as GrammarRule[]} />
}
