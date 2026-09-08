export const qualifiedAlkanesSdk = {
  artifact: "https://pkg.alkanes.build/dist/@alkanes/ts-sdk?v=0.1.6-669e7c0",
  version: "0.1.6-669e7c0",
} as const;

export interface AlkanesSdkRuntime {
  readonly AlkanesProvider: abstract new (
    config: Readonly<Record<string, string>>,
  ) => object;
}

export async function loadAlkanesSdk(): Promise<AlkanesSdkRuntime> {
  const sdk: AlkanesSdkRuntime = await import("@alkanes/ts-sdk");
  return sdk;
}
