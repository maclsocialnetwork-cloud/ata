export interface Question {
  id: string
  bonne_rep: string
}

export function calculerScore(reponses: Record<string, string>, questions: Question[]): number {
  let score = 0
  for (const q of questions) {
    if (reponses[q.id] === q.bonne_rep) score++
  }
  return score
}
