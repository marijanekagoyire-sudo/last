"use client";

import { ResourceManager, type ColumnConfig, type FieldConfig } from "@/components/admin/resource-manager";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { sermonCategories } from "@/lib/site";

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, full: true },
  { name: "speaker", label: "Speaker", type: "text", required: true },
  { name: "sermonDate", label: "Sermon date", type: "date", required: true },
  { name: "scripture", label: "Scripture reference", type: "text" },
  {
    name: "category",
    label: "Category",
    type: "select",
    options: sermonCategories,
    defaultValue: "General",
  },
  { name: "audioUrl", label: "Audio URL", type: "url", help: "Link to an externally hosted audio file." },
  { name: "videoUrl", label: "Video URL", type: "url", help: "YouTube or Vimeo link." },
  { name: "thumbnailUrl", label: "Thumbnail URL", type: "url" },
  { name: "description", label: "Description", type: "textarea", required: true },
];

const COLUMNS: ColumnConfig[] = [
  { key: "title", label: "Title" },
  { key: "speaker", label: "Speaker" },
  {
    key: "sermonDate",
    label: "Date",
    render: (record) => formatDate(String(record.sermonDate ?? "")),
  },
  { key: "category", label: "Category" },
  {
    key: "status",
    label: "Status",
    render: (record) => <StatusBadge status={String(record.status)} />,
  },
];

export default function AdminSermonsPage() {
  return (
    <ResourceManager
      resource="sermons"
      singular="Sermon"
      plural="Sermons"
      fields={FIELDS}
      columns={COLUMNS}
      publicPath="/sermons"
      categories={sermonCategories}
    />
  );
}
