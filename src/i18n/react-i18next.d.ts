import "react-i18next";
import { ReactNode } from "react";

declare module "react-i18next" {
  interface ReactI18NextChildren {
    children?: ReactNode;
  }
}
