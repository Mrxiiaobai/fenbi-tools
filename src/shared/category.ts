export enum SELECTENUM {
  XINGCE = "xingce",
  SHENLUN = "shenlun",
  SYZC = "syzc",
  SYDW = "sydw",
  ZHYYNL = "zhyynl",
  SYDWMS = "sydwms",
}

export type AnswerMode = "objective" | "essay";

export interface CategoryRouteConfig {
  routecs: string;
  courseSetPrefix: string;
  tikuPrefix: string;
  answerMode: AnswerMode;
  apiCategory: string;
  historyCategoryId: number;
}

export const categoryRouteConfigMap: Record<string, CategoryRouteConfig> = {
  [SELECTENUM.XINGCE]: {
    routecs: SELECTENUM.XINGCE,
    courseSetPrefix: SELECTENUM.XINGCE,
    tikuPrefix: SELECTENUM.XINGCE,
    answerMode: "objective",
    apiCategory: SELECTENUM.XINGCE,
    historyCategoryId: 4,
  },
  [SELECTENUM.SHENLUN]: {
    routecs: SELECTENUM.SHENLUN,
    courseSetPrefix: SELECTENUM.SHENLUN,
    tikuPrefix: SELECTENUM.SHENLUN,
    answerMode: "essay",
    apiCategory: SELECTENUM.SHENLUN,
    historyCategoryId: 4,
  },
  [SELECTENUM.SYZC]: {
    routecs: SELECTENUM.SYZC,
    courseSetPrefix: SELECTENUM.SYDW,
    tikuPrefix: SELECTENUM.SYZC,
    answerMode: "objective",
    apiCategory: SELECTENUM.SYZC,
    historyCategoryId: 4,
  },
  [SELECTENUM.SYDW]: {
    routecs: SELECTENUM.SYDW,
    courseSetPrefix: SELECTENUM.SYDW,
    tikuPrefix: SELECTENUM.SYDW,
    answerMode: "objective",
    apiCategory: SELECTENUM.SYDW,
    historyCategoryId: 4,
  },
  [SELECTENUM.ZHYYNL]: {
    routecs: SELECTENUM.ZHYYNL,
    courseSetPrefix: SELECTENUM.ZHYYNL,
    tikuPrefix: SELECTENUM.ZHYYNL,
    answerMode: "essay",
    apiCategory: SELECTENUM.SYDW,
    historyCategoryId: 4,
  },
  [SELECTENUM.SYDWMS]: {
    routecs: SELECTENUM.SYDWMS,
    courseSetPrefix: SELECTENUM.SYDWMS,
    tikuPrefix: SELECTENUM.SYDWMS,
    answerMode: "essay",
    apiCategory: SELECTENUM.SYDWMS,
    historyCategoryId: 4,
  },
};

export const getCategoryRouteConfig = (
  category?: string,
): CategoryRouteConfig => {
  return (
    categoryRouteConfigMap[category || SELECTENUM.XINGCE] ||
    categoryRouteConfigMap[SELECTENUM.XINGCE]
  );
};

export const isEssayCategory = (category?: string) => {
  return getCategoryRouteConfig(category).answerMode === "essay";
};

export const isCareerCategory = (category?: string) => {
  return (
    category === SELECTENUM.SYZC ||
    category === SELECTENUM.SYDW ||
    category === SELECTENUM.ZHYYNL ||
    category === SELECTENUM.SYDWMS
  );
};

export const getFavoriteQuizCourseSetPrefix = (category?: string) => {
  return isCareerCategory(category) ? SELECTENUM.SYDW : SELECTENUM.XINGCE;
};
