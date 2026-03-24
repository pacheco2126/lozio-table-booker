import "react";

declare module "react" {
  // Fixes react-i18next children type incompatibility with React 18
  interface FunctionComponent<P = {}> {
    (props: P & { children?: React.ReactNode }, context?: any): React.ReactElement<any, any> | null;
  }
}
