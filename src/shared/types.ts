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
  questionCount?: number;
  errorPagination?: ErrorPracticePagination;
}

export interface SolutionPayload extends QuestionPayload {
  solutions?: SolutionItem[];
  correctCount?: number;
}

export interface ErrorKeypointNode extends CategoryNode {
  children?: ErrorKeypointNode[];
  childrenLabels?: ErrorKeypointNode[] | null;
  categoryId?: number | string;
  keypointId?: number | string;
  questionIds?: Array<number | string>;
  wrongCount?: number;
}

export type ErrorKeypointTreeResponse = ErrorKeypointNode[];

export interface ErrorPracticePagination {
  categoryId?: number | string;
  page?: number;
  limit?: number;
  total?: number;
  questionIds?: string[];
}

export type ErrorQuestionIdsResponse =
  | Array<number | string>
  | {
      data?: unknown;
      datas?: unknown;
      questionIds?: Array<number | string>;
      ids?: Array<number | string>;
      items?: Array<number | string>;
      list?: Array<number | string>;
      total?: number;
      totalCount?: number;
      count?: number;
      [key: string]: unknown;
    };

export type ErrorSolutionsResponse =
  | SolutionItem[]
  | {
      data?: SolutionItem[] | Record<string, SolutionItem>;
      datas?: SolutionItem[];
      solutions?: SolutionItem[];
      materials?: Array<MaterialData | null>;
      card?: QuestionCard;
      [key: string]: unknown;
    };

export interface SydwmsGiantQuestion extends QuestionItem {
  questionId?: number | string;
  idStr?: string;
  title?: string;
  stem?: string;
  question?: string | Record<string, unknown>;
  answer?: string;
  analysis?: string;
  solution?: string;
  parse?: string;
  source?: string;
  name?: string;
  children?: SydwmsGiantQuestion[];
  [key: string]: unknown;
}

export type SydwmsGiantPayload = Array<number | string>;

export interface SydwmsSolutionAccessory {
  label?: string;
  content?: string;
  name?: string;
  title?: string;
  [key: string]: unknown;
}

export interface SydwmsSolutionItem extends SolutionItem {
  questionId?: number | string;
  idStr?: string;
  answer?: string;
  analysis?: string;
  parse?: string;
  solutionAccessories?: SydwmsSolutionAccessory[];
  [key: string]: unknown;
}

export interface SydwmsSolutionPayload {
  data?: SydwmsSolutionItem[] | Record<string, SydwmsSolutionItem>;
  datas?: SydwmsSolutionItem[];
  materials?: Array<MaterialData | null>;
  solutions?: SydwmsSolutionItem[];
  [key: string]: unknown;
}

export interface SydwmsEpisodeMediaItem {
  url?: string;
  playbackUrl?: string;
  playerUrl?: string;
  originalUrl?: string;
  format?: number;
  duration?: number;
  size?: number;
  realSize?: number;
  bitrate?: number;
  height?: number;
  width?: number;
  [key: string]: unknown;
}

export interface SydwmsEpisodeMetaPayload {
  code?: number;
  msg?: string;
  total?: number;
  data?: SydwmsEpisodeMediaItem | SydwmsEpisodeMediaItem[];
  datas?: SydwmsEpisodeMediaItem[];
  [key: string]: unknown;
}

export interface SydwmsEpisodeItem {
  id?: number | string;
  episodeId?: number | string;
  episode_id?: number | string;
  title?: string;
  name?: string;
  questionId?: number | string;
  tikuId?: number | string;
  media?: unknown;
  meta?: unknown;
  [key: string]: unknown;
}

export interface SydwmsEpisodePayload {
  data?: Record<string, Record<string, SydwmsEpisodeItem> | SydwmsEpisodeItem[]>;
  [key: string]: unknown;
}

export interface SydwmsNotePayload {
  data?: unknown;
  datas?: unknown;
  notes?: unknown;
  [key: string]: unknown;
}

export interface SydwmsInterviewDetailPayload {
  category?: string;
  materials: Array<MaterialData | null>;
  questions: SydwmsSolutionItem[];
  solutions: SydwmsSolutionItem[];
  episodes: SydwmsEpisodeItem[];
  notes?: unknown;
  questionId?: number | string;
  questionIndex: number;
  questionCount: number;
  questionIds: Array<number | string>;
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
