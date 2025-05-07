import * as React from "react";
import { TSetting } from "../types";

export const ThemeContext = React.createContext({
  color: "#ffffff",
} as TSetting);
