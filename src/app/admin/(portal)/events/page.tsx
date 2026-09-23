"use client";

import { ResourceManager, type ColumnConfig, type FieldConfig } from "@/components/admin/resource-manager";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, full: true },
  { name: "eventDate", label: "Event date", type: "date", required: true },
  { name: "location", label: "Location", type: "text", required: true },
  { name: "startTime", label: "Start time", type: "time", help: "24-hour format, e.g. 09:30" },
  { name: "endTime", label: "End time", type: "time", help: "24-hour format, e.g. 11:30" },
  { name: "organizer", label: "Organiser", type: "text" },
  { name: "imageUrl", label: "Image URL", type: "url", help: "Link to an externally hosted image." },
  { name: "registrationUrl", label: "Registration URL", type: "url" },
  { name: "description", label: "Description", type: "textarea", required: true },
];

const COLUMNS: ColumnConfig[] = [
  { key: "title", label: "Title" },
  { key: "eventDate", label: "Date", render: (record) => formatDate(String(record.eventDate ?? "")) },
  { key: "location", label: "Location" },
  {
    key: "status",
    label: "Status",
    render: (record) => <StatusBadge status={String(record.status)} />,
  },
  {
    key: "createdAt",
    label: "Created",
    render: (record) => formatDate(String(record.createdAt ?? "")),
  },
];

export default function AdminEventsPage() {
  return (
    <ResourceManager
      resource="events"
      singular="Event"
      plural="Events"
      fields={FIELDS}
      columns={COLUMNS}
      publicPath="/events"
    />
  );
}
