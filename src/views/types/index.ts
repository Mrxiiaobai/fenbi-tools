export type TQuestionItem = {
  id: number;
  content: string;
  material: number[] | null;
  type: number;
  difficulty: number;
  createdTime: number;
  shortSource: null;
  accessories: {
    options: string[];
    type: 101 | 102 | 210;
  }[];
  correctAnswer: { choice: string; type: 101 | 102 | 210 } | null;
  hasVideo: number;
  materialIndexes: number | null;
  userAnswer: { choice: string; type: number };
};

export type TSolutionItem = TQuestionItem & {
  solution: string;
};

export type TCacheData = {
  combineKey: string;
  exerciseId: number;
  keypointIds: number[];
  sheetType: number;
};

export type TMaterials = {
  content: string;
};

export type TQuestionData = {
  exerciseId: number;
  questions: TQuestionItem[];
  materials: TMaterials[];
};

export type TSolutionData = TQuestionData & {
  solutions: TSolutionItem[];
  questionCount: number;
  correctCount: number;
};

export type TSetting = {
  color: string;
  backgroundColor: string;
};
