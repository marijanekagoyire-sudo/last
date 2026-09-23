import { resourceItemHandlers } from "@/lib/resource-http";

export const dynamic = "force-dynamic";

const handlers = resourceItemHandlers("media");

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
