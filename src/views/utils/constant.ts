import { SELECTENUM } from "../../shared/category";

export {
  categoryRouteConfigMap,
  getCategoryRouteConfig,
  isCareerCategory,
  isEssayCategory,
  isInterviewCategory,
  SELECTENUM,
} from "../../shared/category";
export type { CategoryRouteConfig } from "../../shared/category";

interface TRadioMap {
  [key: string]: string;
  [key: number]: string;
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
    label: "公务员面试",
    value: SELECTENUM.GWYMS,
  },
  {
    label: "事业编笔试",
    value: SELECTENUM.SYZC,
  },
  {
    label: "事业单位综应",
    value: SELECTENUM.ZHYYNL,
  },
  {
    label: "事业单位面试",
    value: SELECTENUM.SYDWMS,
  },
];
