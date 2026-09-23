"use client";

import { ResourceManager, type ColumnConfig, type FieldConfig } from "@/components/admin/resource-manager";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { mediaCategories } from "@/lib/site";

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, full: true },
  {
    name: "mediaType",
    label: "Media type",
    type: "select",
    options: ["PHOTO", "VIDEO", "LIVESTREAM"],
    defaultValue: "PHOTO",
  },
  {
    name: "category",
    label: "Category",
    type: "select",
    options: mediaCategories,
    defaultValue: "Church Activities",
  },
  {
    name: "mediaUrl",
    label: "Media URL",
    type: "url",
    required: true,
    help: "Externally hosted image, video, or livestream link. Large files are never stored in the database.",
  },
  { name: "thumbnailUrl", label: "Thumbnail URL", type: "url" },
  { name: "description", label: "Description", type: "textarea" },
];

const COLUMNS: ColumnConfig[] = [
  { key: "title", label: "Title" },
  { key: "mediaType", label: "Type" },
  { key: "category", label: "Category" },
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

export default function AdminMediaPage() {
  return (
    <ResourceManager
      resource="media"
      singular="Media item"
      plural="Media"
      fields={FIELDS}
      columns={COLUMNS}
      publicPath="/media"
      categories={mediaCategories}
    />
  );
}
