import * as React from "react";
import { FenbiSetting } from "../../shared/types";

// Setting 类型
export type TSetting = FenbiSetting;

// 默认值
const defaultSetting: TSetting = {
  color: "#ffffff",
  backgroundColor: "#ffffff",
  categoryId: "xingce",
  needLineThrough: false,
  fontSize: 12,
};

// Context
const SettingContext = React.createContext<{
  setting: TSetting;
  setSetting: React.Dispatch<React.SetStateAction<TSetting>>;
}>({
  setting: defaultSetting,
  setSetting: () => undefined,
});

// Provider
export const SettingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [setting, setSetting] = React.useState<TSetting>(defaultSetting);

  return (
    <SettingContext.Provider value={{ setting, setSetting }}>
      {children}
    </SettingContext.Provider>
  );
};

// Hook，方便页面使用
export const useSetting = () => React.useContext(SettingContext);
