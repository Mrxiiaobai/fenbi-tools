import { VscodeApi } from "../../shared/types";

declare const acquireVsCodeApi: () => VscodeApi;

let vscode: VscodeApi | null = null;

export const getVscodeApi = () => {
  if (!vscode) {
    vscode = acquireVsCodeApi();
  }
  return vscode;
};
