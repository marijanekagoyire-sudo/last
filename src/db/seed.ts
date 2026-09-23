import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, pool } from "./index";
import { administrators, announcements, events, media, sermons } from "./schema";

/**
 * Idempotent seed: safe to run repeatedly against local or production
 * databases. Existing rows (matched by slug/email) are left untouched.
 */

const IMG = {
  worship: "https://images.pexels.com/photos/36425622/pexels-photo-36425622.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  praise: "https://images.pexels.com/photos/36425621/pexels-photo-36425621.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  congregation: "https://images.pexels.com/photos/29422233/pexels-photo-29422233.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  prayer: "https://images.pexels.com/photos/8468737/pexels-photo-8468737.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  service: "https://images.pexels.com/photos/38274945/pexels-photo-38274945.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  mass: "https://images.pexels.com/photos/38274948/pexels-photo-38274948.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  outreach: "https://images.pexels.com/photos/6646926/pexels-photo-6646926.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  charity: "https://images.pexels.com/photos/6646941/pexels-photo-6646941.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  visit: "https://images.pexels.com/photos/6647027/pexels-photo-6647027.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  wheelchair: "https://images.pexels.com/photos/6646916/pexels-photo-6646916.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

const THUMB = {
  worship: "https://images.pexels.com/photos/36425622/pexels-photo-36425622.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=400&w=600",
  praise: "https://images.pexels.com/photos/36425621/pexels-photo-36425621.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=400&w=600",
  congregation: "https://images.pexels.com/photos/29422233/pexels-photo-29422233.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=400&w=600",
  prayer: "https://images.pexels.com/photos/8468737/pexels-photo-8468737.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=400&w=600",
  service: "https://images.pexels.com/photos/38274945/pexels-photo-38274945.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=400&w=600",
  mass: "https://images.pexels.com/photos/38274948/pexels-photo-38274948.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=400&w=600",
  outreach: "https://images.pexels.com/photos/6646926/pexels-photo-6646926.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=400&w=600",
  charity: "https://images.pexels.com/photos/6646941/pexels-photo-6646941.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=400&w=600",
  visit: "https://images.pexels.com/photos/6647027/pexels-photo-6647027.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=400&w=600",
  wheelchair: "https://images.pexels.com/photos/6646916/pexels-photo-6646916.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=400&w=600",
};

function isoDate(offsetDays: number): string {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function seedAdministrator() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@church.local").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ChurchAdmin@2026!";
  const fullName = process.env.ADMIN_NAME ?? "Church Administrator";

  const existing = await db
    .select({ id: administrators.id })
    .from(administrators)
    .where(eq(administrators.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`• Administrator already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(administrators).values({
    email,
    passwordHash,
    fullName,
    role: "ADMIN",
    isActive: true,
    // The seeded account must rotate its password after the first sign-in.
    mustChangePassword: true,
  });
  console.log(`✓ Administrator created: ${email}`);
}

type EventSeed = typeof events.$inferInsert;
type AnnouncementSeed = typeof announcements.$inferInsert;
type SermonSeed = typeof sermons.$inferInsert;
type MediaSeed = typeof media.$inferInsert;

async function seedEvents() {
  const rows: EventSeed[] = [
    {
      title: "Sunday Worship Celebration",
      slug: "sunday-worship-celebration",
      description:
        "Join the whole church family for a Christ-centred celebration of worship, communion, and teaching from the book of Philippians. Children's church runs during the main service and refreshments follow in the courtyard.",
      eventDate: isoDate(3),
      startTime: "09:30",
      endTime: "11:30",
      location: "Main Sanctuary, 12 Cornerstone Avenue",
      organizer: "Worship Team",
      imageUrl: IMG.worship,
      status: "PUBLISHED",
      publishedAt: daysAgo(6),
    },
    {
      title: "Midweek Bible Study: Living Faith",
      slug: "midweek-bible-study-living-faith",
      description:
        "A verse-by-verse study through the letter of James with practical application for everyday discipleship. Open to members and visitors, no prior registration required.",
      eventDate: isoDate(6),
      startTime: "18:00",
      endTime: "19:30",
      location: "Fellowship Hall",
      organizer: "Pastor Miriam Adeyemi",
      imageUrl: IMG.prayer,
      status: "PUBLISHED",
      publishedAt: daysAgo(5),
    },
    {
      title: "Community Outreach & Food Pantry",
      slug: "community-outreach-food-pantry",
      description:
        "Serve alongside our outreach team distributing groceries and praying with families across the Riverside district. Volunteers gather 30 minutes early for briefing and prayer.",
      eventDate: isoDate(12),
      startTime: "08:00",
      endTime: "13:00",
      location: "Riverside Community Centre",
      organizer: "Outreach Ministry",
      imageUrl: IMG.outreach,
      registrationUrl: "https://example.org/volunteer-signup",
      status: "PUBLISHED",
      publishedAt: daysAgo(4),
    },
    {
      title: "Annual Thanksgiving Service 2026",
      slug: "annual-thanksgiving-service-2026",
      description:
        "A full day of praise, testimonies, and thanksgiving as we celebrate God's faithfulness through the year. Guest choirs, dedication of new members, and a shared meal after the service.",
      eventDate: isoDate(28),
      startTime: "10:00",
      endTime: "14:00",
      location: "Main Sanctuary",
      organizer: "Church Council",
      imageUrl: IMG.congregation,
      status: "PUBLISHED",
      publishedAt: daysAgo(2),
    },
    {
      title: "Youth Encounter Night",
      slug: "youth-encounter-night",
      description:
        "An evening of worship, testimony, and teaching designed for teenagers and young adults. Friends are welcome — bring someone with you.",
      eventDate: isoDate(19),
      startTime: "17:30",
      endTime: "20:00",
      location: "Youth Auditorium",
      organizer: "Youth Ministry",
      imageUrl: IMG.praise,
      status: "DRAFT",
    },
    {
      title: "Leadership Training Retreat",
      slug: "leadership-training-retreat",
      description:
        "A past retreat equipping ministry leaders in pastoral care, teaching, and administration. Recordings are available in the sermons library.",
      eventDate: isoDate(-21),
      startTime: "09:00",
      endTime: "16:00",
      location: "Hillcrest Retreat Centre",
      organizer: "Leadership Development",
      imageUrl: IMG.service,
      status: "PUBLISHED",
      publishedAt: daysAgo(40),
    },
  ];

  for (const row of rows) {
    await db.insert(events).values(row).onConflictDoNothing({ target: events.slug });
  }
  console.log(`✓ Events seeded (${rows.length} sample records)`);
}

async function seedAnnouncements() {
  const rows: AnnouncementSeed[] = [
    {
      title: "New Members Class Begins This Month",
      slug: "new-members-class-begins-this-month",
      content:
        "<p>Our four-week <strong>New Members Class</strong> starts on the first Sunday of the month at 8:00 AM in the Fellowship Hall.</p><p>The class covers what we believe, how we worship, and how you can serve within the church family. Register at the welcome desk after any service.</p>",
      imageUrl: IMG.service,
      status: "PUBLISHED",
      publishedAt: daysAgo(3),
    },
    {
      title: "Church Office Hours Updated",
      slug: "church-office-hours-updated",
      content:
        "<p>The church office is now open <strong>Monday to Friday, 9:00 AM – 4:00 PM</strong>.</p><p>For pastoral emergencies outside these hours, please call the duty pastor line listed on the contact page.</p>",
      status: "PUBLISHED",
      publishedAt: daysAgo(8),
    },
    {
      title: "Volunteers Needed for Children's Ministry",
      slug: "volunteers-needed-for-childrens-ministry",
      content:
        "<p>Our children's ministry is growing and we need additional volunteers for Sunday teaching and check-in.</p><ul><li>Safeguarding training provided</li><li>Serve once a month</li><li>Team support and lesson materials supplied</li></ul><p>Speak with Grace Mensah or use the contact form to express interest.</p>",
      imageUrl: IMG.mass,
      status: "PUBLISHED",
      publishedAt: daysAgo(12),
    },
    {
      title: "Benevolence Fund Applications Open",
      slug: "benevolence-fund-applications-open",
      content:
        "<p>Members facing financial hardship can confidentially apply for support from the benevolence fund. Applications are reviewed weekly by the deacons.</p>",
      status: "PUBLISHED",
      publishedAt: daysAgo(20),
    },
    {
      title: "Draft: Building Renovation Update",
      slug: "draft-building-renovation-update",
      content:
        "<p>Sample draft announcement used for testing the publishing workflow. The renovation committee will share full details after the next council meeting.</p>",
      status: "DRAFT",
    },
  ];

  for (const row of rows) {
    await db.insert(announcements).values(row).onConflictDoNothing({ target: announcements.slug });
  }
  console.log(`✓ Announcements seeded (${rows.length} sample records)`);
}

async function seedSermons() {
  const rows: SermonSeed[] = [
    {
      title: "The Unshakeable Hope of the Gospel",
      slug: "the-unshakeable-hope-of-the-gospel",
      speaker: "Pastor Daniel Okoye",
      scripture: "Romans 8:18-39",
      description:
        "Paul reminds a suffering church that nothing in all creation can separate us from the love of God in Christ Jesus. A message on enduring hope for difficult seasons.",
      sermonDate: isoDate(-4),
      audioUrl: "https://download.samplelib.com/mp3/sample-15s.mp3",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnailUrl: THUMB.worship,
      category: "Sunday Service",
      status: "PUBLISHED",
      publishedAt: daysAgo(4),
    },
    {
      title: "Faith That Works",
      slug: "faith-that-works",
      speaker: "Pastor Miriam Adeyemi",
      scripture: "James 2:14-26",
      description:
        "Genuine faith always produces visible fruit. This study examines how belief and obedience belong together in the Christian life.",
      sermonDate: isoDate(-11),
      audioUrl: "https://download.samplelib.com/mp3/sample-12s.mp3",
      thumbnailUrl: THUMB.prayer,
      category: "Bible Study",
      status: "PUBLISHED",
      publishedAt: daysAgo(11),
    },
    {
      title: "A House of Prayer",
      slug: "a-house-of-prayer",
      speaker: "Elder Samuel Ochieng",
      scripture: "Isaiah 56:6-8",
      description:
        "God's house is to be a house of prayer for all nations. A call to renewed intercession for our city and the nations.",
      sermonDate: isoDate(-18),
      videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      thumbnailUrl: THUMB.congregation,
      category: "Special Service",
      status: "PUBLISHED",
      publishedAt: daysAgo(18),
    },
    {
      title: "Raised With Christ",
      slug: "raised-with-christ",
      speaker: "Pastor Daniel Okoye",
      scripture: "Colossians 3:1-17",
      description:
        "Because we have been raised with Christ, we set our minds on things above and put on compassion, kindness, humility, and love.",
      sermonDate: isoDate(-25),
      audioUrl: "https://download.samplelib.com/mp3/sample-9s.mp3",
      thumbnailUrl: THUMB.service,
      category: "Sunday Service",
      status: "PUBLISHED",
      publishedAt: daysAgo(25),
    },
    {
      title: "Draft: Discipleship in the Home",
      slug: "draft-discipleship-in-the-home",
      speaker: "Pastor Miriam Adeyemi",
      scripture: "Deuteronomy 6:4-9",
      description:
        "Sample draft sermon record used to verify the publishing workflow in the administration portal.",
      sermonDate: isoDate(2),
      category: "Youth",
      status: "DRAFT",
    },
  ];

  for (const row of rows) {
    await db.insert(sermons).values(row).onConflictDoNothing({ target: sermons.slug });
  }
  console.log(`✓ Sermons seeded (${rows.length} sample records)`);
}

async function seedMedia() {
  const rows: MediaSeed[] = [
    {
      title: "Sunday Worship Highlights",
      slug: "sunday-worship-highlights",
      description: "Photo highlights from a recent Sunday morning celebration service.",
      mediaType: "PHOTO",
      mediaUrl: IMG.worship,
      thumbnailUrl: THUMB.worship,
      category: "Worship",
      status: "PUBLISHED",
      publishedAt: daysAgo(3),
    },
    {
      title: "Praise Night Gallery",
      slug: "praise-night-gallery",
      description: "Moments from our quarterly praise and worship night.",
      mediaType: "PHOTO",
      mediaUrl: IMG.praise,
      thumbnailUrl: THUMB.praise,
      category: "Worship",
      status: "PUBLISHED",
      publishedAt: daysAgo(9),
    },
    {
      title: "Food Pantry Outreach",
      slug: "food-pantry-outreach",
      description: "Volunteers serving families at the Riverside community food pantry.",
      mediaType: "PHOTO",
      mediaUrl: IMG.outreach,
      thumbnailUrl: THUMB.outreach,
      category: "Outreach",
      status: "PUBLISHED",
      publishedAt: daysAgo(14),
    },
    {
      title: "Care Team Home Visits",
      slug: "care-team-home-visits",
      description: "Our care team visiting members and neighbours during the week.",
      mediaType: "PHOTO",
      mediaUrl: IMG.visit,
      thumbnailUrl: THUMB.visit,
      category: "Outreach",
      status: "PUBLISHED",
      publishedAt: daysAgo(16),
    },
    {
      title: "Annual Conference Sessions",
      slug: "annual-conference-sessions",
      description: "Teaching sessions from the annual church conference.",
      mediaType: "PHOTO",
      mediaUrl: IMG.congregation,
      thumbnailUrl: THUMB.congregation,
      category: "Conferences",
      status: "PUBLISHED",
      publishedAt: daysAgo(22),
    },
    {
      title: "Sunday Service Livestream",
      slug: "sunday-service-livestream",
      description: "Watch the most recent Sunday service livestream recording.",
      mediaType: "LIVESTREAM",
      mediaUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      thumbnailUrl: THUMB.service,
      category: "Livestream",
      status: "PUBLISHED",
      publishedAt: daysAgo(5),
    },
    {
      title: "Charity Drive Video",
      slug: "charity-drive-video",
      description: "Short film covering the community charity drive and its impact.",
      mediaType: "VIDEO",
      mediaUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnailUrl: THUMB.charity,
      category: "Outreach",
      status: "PUBLISHED",
      publishedAt: daysAgo(30),
    },
    {
      title: "Draft: Youth Camp Album",
      slug: "draft-youth-camp-album",
      description: "Sample draft media record used to test publishing controls.",
      mediaType: "PHOTO",
      mediaUrl: IMG.wheelchair,
      thumbnailUrl: THUMB.wheelchair,
      category: "Youth",
      status: "DRAFT",
    },
  ];

  for (const row of rows) {
    await db.insert(media).values(row).onConflictDoNothing({ target: media.slug });
  }
  console.log(`✓ Media seeded (${rows.length} sample records)`);
}

async function main() {
  console.log("Seeding church database…");
  await db.execute(sql`select 1`);
  await seedAdministrator();
  await seedEvents();
  await seedAnnouncements();
  await seedSermons();
  await seedMedia();
  console.log("Seed complete.");
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    await pool.end();
    process.exit(1);
  });
