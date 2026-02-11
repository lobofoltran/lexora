import { Suspense } from "react";

import { DeckPageClient } from "./page-client";

export default function DeckPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs">Loading deck...</div>}>
      <DeckPageClient />
    </Suspense>
  );
}
