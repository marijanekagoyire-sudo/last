import { resourceCollectionHandlers } from "@/lib/resource-http";

export const dynamic = "force-dynamic";

const handlers = resourceCollectionHandlers("media");

export const GET = handlers.GET;
export const POST = handlers.POST;
