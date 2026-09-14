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
        render: ({ navigation }) => (
          <ProductIndex catalog={catalog} navigation={navigation} />
        ),
      },
      {
        access: { kind: "public" as const },
        path: `${catalog.path}/[slug]` as const,
        render: ({ navigation, params }) => (
          <ProductDetailUnavailable
            catalog={catalog}
            navigation={navigation}
            slug={parseProductSlug(params.slug)}
          />
        ),
      },
    ],
    version: "1.0.0",
  };
}
