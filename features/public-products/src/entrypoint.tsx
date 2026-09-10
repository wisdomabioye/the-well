import type { FeatureEntrypoint } from "@ador/plugin-kit";

import { parseProductSlug, type ProductCatalog } from "./domain/catalog.ts";
import {
  ProductDetailUnavailable,
  ProductIndex,
} from "./ui/product-surface.tsx";

export function createPublicProductEntrypoint(
  catalog: ProductCatalog,
): FeatureEntrypoint {
  return {
    capabilities: ["navigation", "public-page"],
    id: catalog.featureId,
    pages: [
      {
        access: { kind: "public" as const },
        path: catalog.path,
        render: () => <ProductIndex catalog={catalog} />,
      },
      {
        access: { kind: "public" as const },
        path: `${catalog.path}/[slug]` as const,
        render: ({ params }) => (
          <ProductDetailUnavailable
            catalog={catalog}
            slug={parseProductSlug(params.slug)}
          />
        ),
      },
    ],
    version: "1.0.0",
  };
}
