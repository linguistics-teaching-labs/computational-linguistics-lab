export const coreferenceExamples = [
  {
    id: "seminar-call",
    label: "Ambiguous person reference",
    before: "Maya called Elena after the seminar. ",
    pronoun: "She",
    after: " sounded relieved.",
    candidates: [
      { id: "maya", name: "Maya", features: { recency: 0.55, subject: 1, compatibility: 1, mentions: 0.5 }, paraphrase: "Maya sounded relieved.", continuation: "Maya had worried about the result all morning.", note: "Subject prominence favors Maya, although she is not the nearest name." },
      { id: "elena", name: "Elena", features: { recency: 1, subject: 0.25, compatibility: 1, mentions: 0.5 }, paraphrase: "Elena sounded relieved.", continuation: "Elena had been waiting for Maya's call.", note: "Recency favors Elena, and the pronoun is compatible with either person." }
    ]
  },
  {
    id: "committee",
    label: "Number compatibility",
    before: "The committee interviewed the candidate. ",
    pronoun: "They",
    after: " asked several follow-up questions.",
    candidates: [
      { id: "committee", name: "the committee", features: { recency: 0.55, subject: 1, compatibility: 1, mentions: 0.5 }, paraphrase: "The committee asked follow-up questions.", continuation: "Its members compared their notes afterward.", note: "A collective noun can support plural reference in this teaching analysis." },
      { id: "candidate", name: "the candidate", features: { recency: 1, subject: 0.25, compatibility: 0.1, mentions: 0.5 }, paraphrase: "The candidate asked follow-up questions.", continuation: "The candidate wanted more information about the role.", note: "Recency favors the candidate, but singular number reduces compatibility with “they” in this example." }
    ]
  },
  {
    id: "open-device",
    label: "Two compatible objects",
    before: "Jordan put the laptop beside the notebook. ",
    pronoun: "It",
    after: " was already open.",
    candidates: [
      { id: "jordan", name: "Jordan", features: { recency: 0.3, subject: 1, compatibility: 0, mentions: 0.5 }, paraphrase: "Jordan was already open.", continuation: "This reading conflicts with the intended physical-state meaning of “open.”", note: "Subject prominence cannot overcome strong semantic incompatibility at normal weights." },
      { id: "laptop", name: "the laptop", features: { recency: 0.65, subject: 0.45, compatibility: 1, mentions: 0.5 }, paraphrase: "The laptop was already open.", continuation: "Its screen showed the draft document.", note: "The laptop is compatible with “open,” but it is less recent than the notebook." },
      { id: "notebook", name: "the notebook", features: { recency: 1, subject: 0.2, compatibility: 1, mentions: 0.5 }, paraphrase: "The notebook was already open.", continuation: "Several pages contained handwritten notes.", note: "Recency favors the notebook, while world knowledge permits both object readings." }
    ]
  },
  {
    id: "research-summary",
    label: "Salience across sentences",
    before: "The survey documented a change in word choice. The researchers summarized the survey in a report. ",
    pronoun: "It",
    after: " became the focus of the discussion.",
    candidates: [
      { id: "survey", name: "the survey", features: { recency: 0.7, subject: 0.45, compatibility: 1, mentions: 1 }, paraphrase: "The survey became the focus.", continuation: "Participants debated whether its sample was representative.", note: "Repeated mention raises the survey's discourse salience across sentence boundaries." },
      { id: "report", name: "the report", features: { recency: 1, subject: 0.2, compatibility: 1, mentions: 0.5 }, paraphrase: "The report became the focus.", continuation: "Participants examined how its conclusions were phrased.", note: "The report is most recent and remains a coherent alternative." },
      { id: "change", name: "the change in word choice", features: { recency: 0.4, subject: 0.35, compatibility: 0.8, mentions: 0.5 }, paraphrase: "The change became the focus.", continuation: "Participants proposed several explanations for the pattern.", note: "A discourse referent can remain available even when its surface phrase is less recent." }
    ]
  }
];

export const featureLabels = {
  recency: "Recency",
  subject: "Subject prominence",
  compatibility: "Form and meaning compatibility",
  mentions: "Prior mentions"
};

export function getCoreferenceExample(id) {
  const example = coreferenceExamples.find(item => item.id === id);
  if (!example) throw new Error(`Unknown coreference example: ${id}`);
  return example;
}
