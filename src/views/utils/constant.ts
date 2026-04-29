interface TRadioMap {
  [key: string]: string;
}
export const radioMap: TRadioMap = {
  "1": "A",
  "2": "B",
  "3": "C",
  "4": "D",
  "5": "E",
  "6": "F",
  "7": "G",
  "8": "H",
  "9": "I",
  "10": "J",
  "11": "K",
};

export enum SELECTENUM {
  XINGCE = "xingce",
  SHENLUN = "shenlun",
  SYZC = "syzc",
  SYDW = "sydw",
  ZHYYNL = "zhyynl",
}

export type CategoryRouteConfig = {
  routecs: string;
  courseSetPrefix: string;
  tikuPrefix: string;
  answerMode: "objective" | "essay";
  historyCategoryId: number;
};

export const categoryRouteConfigMap: Record<string, CategoryRouteConfig> = {
  [SELECTENUM.XINGCE]: {
    routecs: SELECTENUM.XINGCE,
    courseSetPrefix: SELECTENUM.XINGCE,
    tikuPrefix: SELECTENUM.XINGCE,
    answerMode: "objective",
    historyCategoryId: 4,
  },
  [SELECTENUM.SHENLUN]: {
    routecs: SELECTENUM.SHENLUN,
    courseSetPrefix: SELECTENUM.SHENLUN,
    tikuPrefix: SELECTENUM.SHENLUN,
    answerMode: "essay",
    historyCategoryId: 4,
  },
  [SELECTENUM.SYZC]: {
    routecs: SELECTENUM.SYZC,
    courseSetPrefix: SELECTENUM.SYDW,
    tikuPrefix: SELECTENUM.SYZC,
    answerMode: "objective",
    historyCategoryId: 4,
  },
  [SELECTENUM.SYDW]: {
    routecs: SELECTENUM.SYDW,
    courseSetPrefix: SELECTENUM.SYDW,
    tikuPrefix: SELECTENUM.SYDW,
    answerMode: "objective",
    historyCategoryId: 4,
  },
  [SELECTENUM.ZHYYNL]: {
    routecs: SELECTENUM.ZHYYNL,
    courseSetPrefix: SELECTENUM.ZHYYNL,
    tikuPrefix: SELECTENUM.ZHYYNL,
    answerMode: "essay",
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

export const categoryOptions = [
  {
    label: "行测",
    value: SELECTENUM.XINGCE,
  },
  {
    label: "申论",
    value: SELECTENUM.SHENLUN,
  },
  {
    label: "事业编笔试",
    value: SELECTENUM.SYZC,
  },
  {
    label: "事业单位综应",
    value: SELECTENUM.ZHYYNL,
  },
];
