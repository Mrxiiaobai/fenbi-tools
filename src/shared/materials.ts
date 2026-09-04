import { MaterialData, QuestionCard } from "./types";

const getQuestionCardNodes = (card: QuestionCard | undefined) => {
  return (card?.children || []).flatMap((chapter) => chapter.children || []);
};

export const buildMaterialsForQuestions = (
  cards: QuestionCard | undefined,
  materials: MaterialData[] = [],
): Array<MaterialData | null> => {
  const materialContentMap = new Map(
    materials.map((material) => [material.globalId, material.content]),
  );

  const usedMaterialKeys = new Set<string | number>();
  const materialsForRender: Array<MaterialData | null> = [];
  const questions = getQuestionCardNodes(cards);

  questions.forEach((question, index) => {
    const keys = question.materialKeys;

    if (!keys || keys.length === 0) {
      materialsForRender[index] = null;
      return;
    }

    const key = keys[0];

    if (!usedMaterialKeys.has(key)) {
      usedMaterialKeys.add(key);
      materialsForRender[index] = {
        globalId: key,
        content: materialContentMap.get(key) || null,
      };
      return;
    }

    materialsForRender[index] = null;
  });

  return materialsForRender;
};
