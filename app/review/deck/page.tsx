import { Suspense } from "react";

import { ReviewDeckPageClient } from "./page-client";

export default function ReviewDeckPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs">Loading deck review...</div>}>
      <ReviewDeckPageClient />
    </Suspense>
  );
}
