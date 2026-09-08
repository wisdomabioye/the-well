import { createElement } from "react";

import { WalletProvider } from "../../src/client/provider.tsx";

const qualificationElement = createElement(WalletProvider, {
  children: createElement("span", undefined, "qualification"),
  network: "signet",
});

document.body.append(String(qualificationElement.type));
