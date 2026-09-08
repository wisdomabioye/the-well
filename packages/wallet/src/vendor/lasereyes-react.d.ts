import type { ReactNode } from "react";

declare module "@omnisat/lasereyes-react" {
  import type { Config } from "@omnisat/lasereyes-core";

  export function LaserEyesProvider(props: {
    readonly children: ReactNode | readonly ReactNode[];
    readonly config?: Config;
  }): ReactNode;
}
