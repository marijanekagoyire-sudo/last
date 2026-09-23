"use client";

import { ResourceManager, type ColumnConfig, type FieldConfig } from "@/components/admin/resource-manager";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, full: true },
  { name: "imageUrl", label: "Image URL", type: "url", help: "Optional banner image." },
  { name: "content", label: "Content", type: "richtext", required: true },
];

const COLUMNS: ColumnConfig[] = [
  { key: "title", label: "Title" },
  {
    key: "status",
    label: "Status",
    render: (record) => <StatusBadge status={String(record.status)} />,
  },
  {
    key: "publishedAt",
    label: "Published",
    render: (record) =>
      record.publishedAt ? formatDate(String(record.publishedAt)) : "Not published",
  },
  {
    key: "createdAt",
    label: "Created",
    render: (record) => formatDate(String(record.createdAt ?? "")),
  },
];

export default function AdminAnnouncementsPage() {
  return (
    <ResourceManager
      resource="announcements"
      singular="Announcement"
      plural="Announcements"
      fields={FIELDS}
      columns={COLUMNS}
      publicPath="/announcements"
    />
  );
}
