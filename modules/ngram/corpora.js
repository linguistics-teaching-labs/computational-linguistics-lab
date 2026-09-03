export const corpora = {
  campus: {
    name: "Campus language",
    description: "A compact teaching corpus with repeated academic patterns.",
    text: `
The student reads the article. The student reads the chapter. The student reads the question.
The student writes the answer. The student writes the paper. The student studies language.
The professor reads the paper. The professor reads the answer. The professor teaches the class.
The professor explains the model. The professor explains the example. The professor asks a question.
The class studies language. The class studies probability. The class tests the model.
Students learn from examples. Students learn from practice. Students learn from mistakes.
The model predicts the next word. The model counts each word. The model learns from data.
The language model sees patterns. The language model misses meaning. The language model needs data.
A larger corpus contains more patterns. A smaller corpus contains fewer patterns.
More context can improve a prediction. More context can create sparse data.
The curious student tests a prediction. The careful student checks the counts.
The class compares two models. The class discusses each result. The class finds an unexpected pattern.
    `.trim()
  },
  conversation: {
    name: "Everyday conversation",
    description: "A small conversational corpus with questions and short responses.",
    text: `
Are you going to class? I am going to class now. I will meet you after class.
Are you reading the chapter? I am reading the chapter now. I will finish the chapter tonight.
Do you understand the example? I understand the first example. I do not understand the last example.
Can you explain the answer? I can explain the answer. I cannot explain the model yet.
What did the professor say? The professor said to check the data. The professor said to compare the models.
What does the model predict? The model predicts another word. The model predicts from context.
That prediction looks reasonable. That prediction looks strange. That prediction depends on the corpus.
I think the class is useful. I think the example is clear. I think the model is simple.
We can test another sentence. We can change the context. We can inspect the counts.
Let us compare the results. Let us try a larger context. Let us discuss the errors.
    `.trim()
  },
  story: {
    name: "Miniature story",
    description: "A narrative corpus with recurring characters, actions, and places.",
    text: `
The fox entered the quiet garden. The fox followed the narrow path. The fox watched the old gate.
The bird entered the quiet garden. The bird crossed the narrow path. The bird rested near the old gate.
The gardener opened the old gate. The gardener walked along the narrow path. The gardener watched the small bird.
At sunrise the garden looked golden. At sunrise the fox left the garden. At sunrise the bird began to sing.
At sunset the garden looked blue. At sunset the fox returned to the garden. At sunset the gardener closed the gate.
The quiet garden held many secrets. The old gate made a soft sound. The narrow path disappeared under the leaves.
The fox heard the bird. The bird heard the gardener. The gardener heard the old gate.
Then the fox stopped. Then the bird flew away. Then the garden became quiet again.
    `.trim()
  }
};
