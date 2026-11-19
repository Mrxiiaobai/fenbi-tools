import * as React from "react";
import { VscodeHostMessage } from "../../shared/types";

export const useVscodeMessage = (
  handler: (message: VscodeHostMessage) => void,
) => {
  const handlerRef = React.useRef(handler);

  React.useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  React.useEffect(() => {
    const listener = (event: MessageEvent<VscodeHostMessage>) => {
      if (typeof event.data?.command === "string") handlerRef.current(event.data);
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);
};
