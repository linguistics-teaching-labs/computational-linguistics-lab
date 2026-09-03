export const labelNames = {
  favorable: "Favorable",
  unfavorable: "Unfavorable"
};

export const reviewCorpora = {
  balanced: {
    label: "Balanced review corpus",
    note: "The two classes contain parallel vocabulary and several examples of negation. The dataset is still very small.",
    training: [
      { label: "favorable", text: "the movie was warm and funny" },
      { label: "favorable", text: "an engaging story with excellent acting" },
      { label: "favorable", text: "smart dialogue and a satisfying ending" },
      { label: "favorable", text: "the performances were charming and lively" },
      { label: "favorable", text: "good pacing made the film enjoyable" },
      { label: "favorable", text: "an original plot with memorable characters" },
      { label: "favorable", text: "the film was not dull" },
      { label: "unfavorable", text: "the movie was dull and slow" },
      { label: "unfavorable", text: "a confusing story with terrible acting" },
      { label: "unfavorable", text: "flat dialogue and a disappointing ending" },
      { label: "unfavorable", text: "the performances were awkward and lifeless" },
      { label: "unfavorable", text: "bad pacing made the film tedious" },
      { label: "unfavorable", text: "a predictable plot with forgettable characters" },
      { label: "unfavorable", text: "the jokes were not funny" }
    ],
    test: [
      { label: "favorable", text: "the acting was excellent", reason: "Several favorable words appeared in training." },
      { label: "unfavorable", text: "the story was dull", reason: "The word “dull” is strong unfavorable evidence." },
      { label: "unfavorable", text: "the ending was not satisfying", reason: "Negation reverses the apparent polarity of “satisfying.”" },
      { label: "favorable", text: "not a dull movie", reason: "The phrase means the opposite of the word “dull” alone." },
      { label: "unfavorable", text: "forgettable acting and slow pacing", reason: "Multiple unfavorable features reinforce one another." },
      { label: "favorable", text: "memorable characters and smart dialogue", reason: "Multiple favorable features reinforce one another." },
      { label: "favorable", text: "the documentary was informative", reason: "Most content words are outside the tiny training vocabulary." },
      { label: "unfavorable", text: "original but tedious", reason: "The sentence mixes evidence associated with both classes." }
    ]
  },
  shortcut: {
    label: "Source-correlated corpus",
    note: "Every favorable training review mentions a festival; every unfavorable review mentions streaming. The source becomes a tempting shortcut.",
    training: [
      { label: "favorable", text: "festival review warm and funny" },
      { label: "favorable", text: "festival review excellent acting" },
      { label: "favorable", text: "festival review smart dialogue" },
      { label: "favorable", text: "festival review satisfying ending" },
      { label: "favorable", text: "festival review charming performances" },
      { label: "favorable", text: "festival review memorable characters" },
      { label: "unfavorable", text: "streaming review dull and slow" },
      { label: "unfavorable", text: "streaming review terrible acting" },
      { label: "unfavorable", text: "streaming review flat dialogue" },
      { label: "unfavorable", text: "streaming review disappointing ending" },
      { label: "unfavorable", text: "streaming review awkward performances" },
      { label: "unfavorable", text: "streaming review forgettable characters" }
    ],
    test: [
      { label: "unfavorable", text: "festival review dull and disappointing", reason: "The source shortcut conflicts with the review language." },
      { label: "favorable", text: "streaming review excellent and charming", reason: "The source shortcut conflicts with the review language." },
      { label: "favorable", text: "festival review warm and memorable", reason: "Source and review language point in the same direction." },
      { label: "unfavorable", text: "streaming review slow and forgettable", reason: "Source and review language point in the same direction." },
      { label: "favorable", text: "classroom screening with smart dialogue", reason: "A new source tests whether the model learned content or provenance." },
      { label: "unfavorable", text: "classroom screening with flat dialogue", reason: "A new source tests whether the model learned content or provenance." },
      { label: "favorable", text: "streaming review memorable characters", reason: "A favorable judgment appears with the previously unfavorable source." },
      { label: "unfavorable", text: "festival review terrible acting", reason: "An unfavorable judgment appears with the previously favorable source." }
    ]
  }
};
