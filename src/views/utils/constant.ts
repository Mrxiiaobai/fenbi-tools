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
}

export const categoryOptions = [
  {
    label: "行测",
    value: SELECTENUM.XINGCE,
  },
  {
    label: "申论",
    value: SELECTENUM.SHENLUN,
  },
];
