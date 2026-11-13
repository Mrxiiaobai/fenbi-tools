import { normalizeChoice } from "./answerChoice";
import { SolutionItem } from "./types";

export const getObjectiveResultStats = (solutions: SolutionItem[] = []) => {
  let questionCount = 0;
  let correctCount = 0;
  solutions.forEach((item) => {
    const multiple = item.type === 2;
    const answer = normalizeChoice(item.userAnswer?.choice, multiple);
    const expected = normalizeChoice(item.correctAnswer?.choice, multiple);
    if (!answer || !expected) return;
    questionCount += 1;
    if (answer === expected) correctCount += 1;
  });
  return { questionCount, correctCount };
};
