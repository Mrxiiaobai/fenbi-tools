"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSetting = exports.SettingProvider = void 0;
const react_1 = require("react");
// 默认值
const defaultSetting = {
    color: "#ffffff",
    backgroundColor: "#ffffff",
};
// Context
const SettingContext = (0, react_1.createContext)({
    setting: defaultSetting,
    setSetting: () => { },
});
// Provider
const SettingProvider = ({ children, }) => {
    const [setting, setSetting] = (0, react_1.useState)(defaultSetting);
    return (react_1.default.createElement(SettingContext.Provider, { value: { setting, setSetting } }, children));
};
exports.SettingProvider = SettingProvider;
// Hook，方便页面使用
const useSetting = () => (0, react_1.useContext)(SettingContext);
exports.useSetting = useSetting;
//# sourceMappingURL=hooks.js.map