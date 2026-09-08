import { WalletProvider } from "../../../../src/client/provider";

export default function Page() {
  return (
    <WalletProvider network="signet">
      <main>Wallet qualification</main>
    </WalletProvider>
  );
}
