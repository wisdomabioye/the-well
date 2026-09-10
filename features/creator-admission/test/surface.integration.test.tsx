import { createUuidV7 } from "@ador/shared/identifiers";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CreatorApplicationSurface } from "../src/ui/creator-application-surface.tsx";

describe("creator admission surfaces", () => {
  it("renders a studio form without claiming project authority", () => {
    const markup = renderToStaticMarkup(
      <CreatorApplicationSurface
        application={null}
        mode="studio"
        unavailable={false}
      />,
    );
    expect(markup).toContain("Apply to create");
    expect(markup).toContain("Save private draft");
    expect(markup).toContain("separate from project publication");
  });

  it("keeps private review fields off the creator surface", () => {
    const review = renderToStaticMarkup(
      <CreatorApplicationSurface
        application={null}
        mode="review"
        unavailable={false}
      />,
    );
    const studio = renderToStaticMarkup(
      <CreatorApplicationSurface
        application={null}
        mode="studio"
        unavailable={false}
      />,
    );
    expect(review).toContain("Private reviewer notes");
    expect(studio).not.toContain("Private reviewer notes");
  });

  it("renders persisted values and an honest degraded state", () => {
    const application = {
      applicantUserId: createUuidV7(),
      draft: {
        contentDeclarationAccepted: true,
        displayName: "Visible Creator",
        expectedLaunchSize: "Small",
        expectedLaunchTiming: "Soon",
        jurisdictionAcknowledged: true,
        portfolioLinks: [],
        projectSummary: "Visible summary",
        provenanceDeclarationAccepted: true,
        rightsDeclarationAccepted: true,
      },
      id: createUuidV7(),
      revision: 1,
      state: "draft" as const,
    };
    expect(
      renderToStaticMarkup(
        <CreatorApplicationSurface
          application={application}
          mode="studio"
          unavailable={false}
        />,
      ),
    ).toContain("Visible Creator");
    const degraded = renderToStaticMarkup(
      <CreatorApplicationSurface
        application={null}
        mode="studio"
        unavailable
      />,
    );
    expect(degraded).toContain("No state is being inferred");
    expect(degraded).not.toContain("Save private draft");
  });
});
