"use client";

import { useSearchParams } from "next/navigation";

import { TopicCardsClient } from "./topic-cards-client";

export function TopicPageClient() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("id") ?? "";

  return <TopicCardsClient topicId={topicId} />;
}
