import * as React from "react";
import { FenbiSetting } from "../../shared/types";
import { useVscodeMessage } from "../hooks/useVscodeMessage";

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

  useVscodeMessage(
    React.useCallback((message) => {
      if (message.command !== "setting") return;

      setSetting((prev) => {
        const nextSetting = {
          ...prev,
          ...((message.data || {}) as TSetting),
        };

        document.documentElement.style.setProperty(
          "--primary-color",
          nextSetting.color || "#ffffff",
        );
        document.documentElement.style.setProperty(
          "--primary-backgroundColor",
          nextSetting.backgroundColor || "#ffffff",
        );
        document.documentElement.style.setProperty(
          "--primary-fontSize",
          `${nextSetting.fontSize || 12}px`,
        );

        return nextSetting;
      });
    }, []),
  );

  return (
    <SettingContext.Provider value={{ setting, setSetting }}>
      {children}
    </SettingContext.Provider>
  );
};

// Hook，方便页面使用
export const useSetting = () => React.useContext(SettingContext);
