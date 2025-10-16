declare const acquireVsCodeApi: any;

let vscode: any = null;

export const getVscodeApi = () => {
  if (!vscode) {
    vscode = acquireVsCodeApi();
  }
  return vscode;
};
