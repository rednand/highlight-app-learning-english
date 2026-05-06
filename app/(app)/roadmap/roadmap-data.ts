export type RoadmapLevel = "Basic" | "Intermediate" | "Advanced"

export type RoadmapTema = {
  tema: string
  sessions: (string | null)[]
}

export type RoadmapData = {
  level: RoadmapLevel
  temas: RoadmapTema[]
}

export const ROADMAP: RoadmapData[] = [
  {
    level: "Basic",
    temas: [
      { tema: "Tema 1", sessions: ["Alphabet","Seasons","Subject Pronouns (to be)","Subject Pronouns Contractions","Simple Present","Imperative","Present Continuous","Possessive Adjectives","Wh Questions","What Time Is It"] },
      { tema: "Tema 2", sessions: ["Numbers 1–10","Weather","Family Members","Subject Pronouns Contractions (Yes/No)","3rd Person Rules","Fruits & Vegetables","Present Continuous (Yes/No)","Adverbs of Place","Classroom Vocabulary","Prepositions of Time"] },
      { tema: "Tema 3", sessions: ["Cardinal Numbers","Colors","Magic Words","Animals & Pets","Simple Present (Yes/No)","Adjectives","Prepositions of Place","Adverbs of Time","Virtual Classroom Language","Prepositions (At/In/On)"] },
      { tema: "Tema 4", sessions: ["Ordinal Numbers","Geometric Shapes","Introducing Myself","Countries/Nationalities","Jobs","Common Adjectives","Community Places","Adverbs of Quantity","Rooms of House","Prepositions Movement"] },
      { tema: "Tema 5", sessions: ["Days of Week","Body Parts","Spelling Name","Plural Rules","There is/are","Comparatives","Directions","Adverbs of Manner","Parts of House","Feelings"] },
      { tema: "Tema 6", sessions: ["Months","Daily Routines","Possessive 's","Demonstratives","Articles","Can/Can't","Present vs Continuous","Frequency Adverbs","Restaurant Vocabulary","Everyday vs Every day"] },
      { tema: "Tema 7", sessions: ["Dates",null,null,null,"A vs An / Some vs Any","One vs Ones",null,"How Often?","Appearance","Do vs Make"] },
      { tema: "Tema 8", sessions: [null,null,null,null,null,null,null,null,"For vs Since",null] },
    ],
  },
  {
    level: "Intermediate",
    temas: [
      { tema: "Tema 1", sessions: ["Was/Were","Past Continuous","Possessive Pronouns","Object Pronouns","Reflexive Pronouns","Phrasal Verbs 1","Will","Going To","Future Continuous","Present Perfect"] },
      { tema: "Tema 2", sessions: ["Simple Past","Past Continuous Yes/No","Travel Vocabulary","Quantifiers","Shopping","Adjectives -ed/-ing","Future Yes/No","Going To Yes/No","Future Continuous Yes/No","Present Perfect Yes/No"] },
      { tema: "Tema 3", sessions: ["Regular Verbs","Traveling","Likes/Dislikes","How much/many","Gerund","May/Might","Health Vocabulary","Indefinite Pronouns","Connectors","Phrasal Verbs 2"] },
      { tema: "Tema 4", sessions: ["Irregular Verbs","Compound Adjectives","Like vs As","All vs Every","Sports","Must vs Don't Have","Modal Verbs","Used to/Would","Chores","Another/Other"] },
      { tema: "Tema 5", sessions: ["Past Yes/No","Food & Drinks","Who/Which/That","Shopping Vocabulary","Very/Too/Enough","Clothing","Technology","Will vs Going To","Both/Either/Neither","Still/Yet/Already"] },
      { tema: "Tema 6", sessions: ["There was/were","Fast Food",null,null,null,null,null,null,null,null] },
    ],
  },
  {
    level: "Advanced",
    temas: [
      { tema: "Tema 1", sessions: ["Past Perfect","Embedded Questions","Future Perfect","Sentence Connectors","Present Perfect Continuous","Past Perfect Continuous","Reported Speech","Direct/Indirect Speech","Future Perfect Continuous","Phrasal Verbs 4"] },
      { tema: "Tema 2", sessions: ["Past Perfect Yes/No","Infinitive/Gerund","Future Perfect Yes/No","Phrasal Verbs 3","Present Perfect Continuous Yes/No","Past Perfect Continuous Yes/No","Passive Voice","Relative Clauses","Contrast Connectors","Persuasion Connectors"] },
      { tema: "Tema 3", sessions: ["Question Tags","So vs Too","Subjunctive","Opinion Connectors","Reported Statements","Present Participle","Addition Connectors","Informal Language","Future Perfect Continuous Yes/No","Second Conditional"] },
      { tema: "Tema 4", sessions: ["Free Time","Past Modals","Probability Adverbs","Conclusion Connectors","Sequence Connectors","Past Participle","Illustration Connectors","Emphasis Connectors","Zero Conditional","Third Conditional"] },
      { tema: "Tema 5", sessions: ["Idioms","If Only/I Wish",null,"Idioms 2","Comparison Connectors","Perfect Participle","Comparisons as...as","Cause & Effect","First Conditional","Mixed Conditionals"] },
    ],
  },
]

export function totalSessions(data: RoadmapData): number {
  return data.temas.reduce((acc, t) => acc + t.sessions.filter(Boolean).length, 0)
}

export function sessionKey(level: RoadmapLevel, tema: string, session: string): string {
  return `${level}||${tema}||${session}`
}
