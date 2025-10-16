import * as React from "react";

// Setting 类型
export interface TSetting {
  color?: string;
  backgroundColor?: string;
  categoryId?: string;
  [key: string]: any;
}

// 默认值
const defaultSetting: TSetting = {
  color: "#ffffff",
  backgroundColor: "#ffffff",
  categoryId: "xingce",
};

// Context
const SettingContext = React.createContext<{
  setting: TSetting;
  setSetting: (s: TSetting) => void;
}>({
  setting: defaultSetting,
  setSetting: () => {},
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
