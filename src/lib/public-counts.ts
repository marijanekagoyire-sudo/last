import { countResource } from "./resource";

export type PublicCounts = {
  events: number;
  announcements: number;
  sermons: number;
  media: number;
};

/** Counts of publicly visible (published) records, used on the publications hub. */
export async function getDashboardCountsForPublic(): Promise<PublicCounts> {
  const [events, announcements, sermons, media] = await Promise.all([
    countResource("events", { publishedOnly: true }),
    countResource("announcements", { publishedOnly: true }),
    countResource("sermons", { publishedOnly: true }),
    countResource("media", { publishedOnly: true }),
  ]);

  return { events, announcements, sermons, media };
}
