import { resourceCollectionHandlers } from "@/lib/resource-http";

export const dynamic = "force-dynamic";

const handlers = resourceCollectionHandlers("events");

export const GET = handlers.GET;
export const POST = handlers.POST;
