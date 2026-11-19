import * as React from "react";
import { SidebarAction } from "../../shared/types";
import { getVscodeApi } from "../utils/vscodeApi";

const alwaysAvailable = () => true;

export function useSidebarAction(
  action: SidebarAction,
  run: () => void,
  enabled = true,
  acceptsFocus = alwaysAvailable,
) {
  const runRef = React.useRef(run);
  React.useEffect(() => { runRef.current = run; }, [run]);

  React.useEffect(() => {
    let available: boolean | undefined;
    let composing = false;
    let heldKey = "";
    let handledKey = "";
    const publish = (next: boolean) => {
      if (available === next) return;
      available = next;
      getVscodeApi().postMessage({ command: "sidebarShortcutContext", postData: { action, available: next } });
    };
    const canRun = () => enabled && !composing && acceptsFocus();
    const refresh = () => publish(document.hasFocus() && !document.hidden && canRun());
    const clearKeys = () => { heldKey = handledKey = ""; };
    const blur = () => { clearKeys(); composing = false; publish(false); };
    const composition = (event: CompositionEvent) => {
      composing = event.type === "compositionstart";
      refresh();
    };
    const keyDown = (event: KeyboardEvent) => {
      if (!event.repeat) {
        heldKey = event.code;
        handledKey = "";
      } else if (event.code && event.code === handledKey) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const keyUp = (event: KeyboardEvent) => { if (event.code === heldKey) clearKeys(); };
    const receive = (event: MessageEvent) => {
      if (event.data?.action !== action || !canRun()) return;
      if (heldKey && heldKey === handledKey) return;
      handledKey = heldKey;
      runRef.current();
    };
    refresh();
    window.addEventListener("message", receive);
    window.addEventListener("focus", refresh);
    window.addEventListener("blur", blur);
    document.addEventListener("focusin", refresh);
    document.addEventListener("focusout", refresh);
    document.addEventListener("visibilitychange", refresh);
    document.addEventListener("compositionstart", composition);
    document.addEventListener("compositionend", composition);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("message", receive);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("blur", blur);
      document.removeEventListener("focusin", refresh);
      document.removeEventListener("focusout", refresh);
      document.removeEventListener("visibilitychange", refresh);
      document.removeEventListener("compositionstart", composition);
      document.removeEventListener("compositionend", composition);
      document.removeEventListener("keydown", keyDown);
      document.removeEventListener("keyup", keyUp);
      publish(false);
    };
  }, [action, enabled, acceptsFocus]);
}
