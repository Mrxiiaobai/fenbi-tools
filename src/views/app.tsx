import * as React from "react";
import { Routes, Route, HashRouter } from "react-router-dom";
import { Home } from "./pages/Index";
import { History } from "./pages/History";
import { Detail } from "./pages/Detail";
import { SydwmsDetail } from "./pages/SydwmsDetail";
import { Answer } from "./pages/Answer";
import { Errors } from "./pages/Errors";
import { ErrorsDetail } from "./pages/ErrorsDetail";
import { Papers } from "./pages/Papers";
import { SettingProvider } from "./components/hooks";
import { DisguiseProvider, useDisguise } from "./components/disguise";
import { useVscodeMessage } from "./hooks/useVscodeMessage";

import "./style/index.less";
import "./style/disguise.less";

const DisguiseToggleListener: React.FC = () => {
  const { startDisguise } = useDisguise();
  useVscodeMessage(
    React.useCallback(
      (message) => {
        if (message.command === "showDisguise") {
          startDisguise();
        }
      },
      [startDisguise],
    ),
  );
  return null;
};

export const App = () => {
  return (
    <SettingProvider>
      <DisguiseProvider>
        <DisguiseToggleListener />
        <div className="app">
          <HashRouter>
            <Routes>
              <Route index path="/" element={<Home />} />
              <Route path="/detail" element={<Detail />} />
              <Route path="/sydwms-detail" element={<SydwmsDetail />} />
              <Route path="/history" element={<History />} />
              <Route path="/answer" element={<Answer />} />
              <Route path="/errors" element={<Errors />} />
              <Route path="/errors-detail" element={<ErrorsDetail />} />
              <Route path="/papers" element={<Papers />} />
              {/* <Route path="*" element={<NotFound />} /> */}
            </Routes>
          </HashRouter>
        </div>
      </DisguiseProvider>
    </SettingProvider>
  );
};
