import { Suspense } from "react";

import { TopicPageClient } from "./page-client";

export default function TopicPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs">Loading topic...</div>}>
      <TopicPageClient />
    </Suspense>
  );
}
