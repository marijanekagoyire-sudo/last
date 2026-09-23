import { resourceCollectionHandlers } from "@/lib/resource-http";

export const dynamic = "force-dynamic";

const handlers = resourceCollectionHandlers("announcements");

export const GET = handlers.GET;
export const POST = handlers.POST;
