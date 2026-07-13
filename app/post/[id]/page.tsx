import { FeedPostPageClient } from "@/components/home/feed-post-page-client"

/** Legacy `/post/123` → resolved inside client to `/p/<uid>`. */
export default function LegacyFeedPostPage() {
  return <FeedPostPageClient />
}
