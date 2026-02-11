"use client";

import { useSearchParams } from "next/navigation";

import { TopicReviewClient } from "./topic-review-client";

export function ReviewTopicPageClient() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topicId") ?? "";

  return <TopicReviewClient topicId={topicId} />;
}
