import { Suspense } from "react";

import { ReviewTopicPageClient } from "./page-client";

export default function ReviewTopicPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs">Loading topic review...</div>}>
      <ReviewTopicPageClient />
    </Suspense>
  );
}
