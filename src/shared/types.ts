export type RequestMethod = "POST" | "GET" | "FORM" | "PUT" | "DELETE";

export interface FenbiSetting {
  color?: string;
  backgroundColor?: string;
  categoryId?: string;
  needLineThrough?: boolean;
  fontSize?: number;
  canvasBrushColor?: string;
  canvasBrushWidth?: number;
  cookie?: string;
  [key: string]: unknown;
}

export interface FenbiAnswer {
  type: number;
  choice?: string;
  answer?: string;
}

export interface UserAnswerRecord {
  answer?: FenbiAnswer;
}

export type UserAnswers = Record<string, UserAnswerRecord>;

export interface StaticUrlData {
  urls?: string[];
}

export interface ExerciseData {
  staticUrl?: StaticUrlData;
  userAnswers?: UserAnswers;
  ancientExerciseId?: {
    id?: number;
  };
}

export interface ExerciseResult {
  code?: number;
  msg?: string;
  message?: string;
  data?: ExerciseData;
}

export interface ExerciseKeyResponse {
  code?: number;
  message?: string;
  key?: string;
}

export interface UserQuestionInfoData {
  questionCount?: number;
  sheetType?: number;
  yearScope?: number | string;
  correctRatioLow?: number;
  correctRatioHigh?: number;
}

export interface UserQuestionInfoResponse {
  data?: UserQuestionInfoData;
}

export interface UserTemplateInfoData {
  yearScope?: number;
}

export interface UserTemplateInfoResponse {
  data?: UserTemplateInfoData;
}

export interface MaterialData {
  globalId?: string | number;
  content?: string | null;
}

export interface QuestionCardNode {
  children?: QuestionCardNode[];
  materialKeys?: Array<string | number>;
}

export interface QuestionCard {
  children?: QuestionCardNode[];
}

export interface QuestionAccessory {
  options?: string[];
  type?: number;
  wordCount?: number;
}

export interface QuestionItem {
  id?: number;
  globalId?: string | number;
  content?: string;
  material?: number[] | null;
  type?: number;
  difficulty?: number;
  createdTime?: number;
  shortSource?: string | null;
  accessories?: QuestionAccessory[];
  correctAnswer?: FenbiAnswer | null;
  hasVideo?: number;
  materialIndexes?: number[] | null;
  materialKeys?: Array<string | number>;
  userAnswer?: FenbiAnswer;
}

export interface SolutionItem extends QuestionItem {
  solution?: string;
}

export interface CacheData {
  combineKey?: string;
  exerciseId?: number;
  keypointIds?: Array<number | string>;
  sheetType?: number;
}

export interface QuestionPayload {
  exerciseId?: number;
  combineKey?: string;
  combinKey?: string;
  questions?: QuestionItem[];
  materials?: Array<MaterialData | null>;
}

export interface SolutionPayload extends QuestionPayload {
  solutions?: SolutionItem[];
  questionCount?: number;
  correctCount?: number;
}

export interface CategoryNode {
  id: number | string;
  name?: string;
  children?: CategoryNode[];
  childrenLabels?: CategoryNode[] | null;
  count?: number;
  answerCount?: number;
  labelMeta?: {
    paperCount?: number;
  };
}

export interface HistoryExercise {
  id?: number;
  key?: string;
  status?: number;
  createTime?: number | string;
  questionCount?: number;
  correctCount?: number;
  sheet?: {
    name?: string;
    type?: number;
  };
}

export interface HistoryResponse {
  datas?: HistoryExercise[];
}

export interface FavoriteQuizResponseData {
  currentQuizVO?: {
    quizId?: number;
  };
  favoriteQuizVO?: Array<{
    id: number;
    name: string;
  }>;
}

export interface FavoriteQuizResponse {
  data?: FavoriteQuizResponseData;
  currentQuizVO?: FavoriteQuizResponseData["currentQuizVO"];
  favoriteQuizVO?: FavoriteQuizResponseData["favoriteQuizVO"];
}

export interface WebviewRequestMessage<T = unknown> {
  command: string;
  postData?: T;
  inc?: boolean;
}

export interface VscodeHostMessage<T = unknown> {
  command: string;
  data?: T;
}

export interface VscodeApi {
  postMessage(message: WebviewRequestMessage): void;
  getState?<T = unknown>(): T;
  setState?(state: unknown): void;
}
