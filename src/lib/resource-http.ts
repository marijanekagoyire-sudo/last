import { getClientIp, handleRouteError, jsonError, jsonOk, readJsonBody, HttpError } from "./api";
import { getSession, requireAdmin } from "./auth";
import { writeAuditLog } from "./audit";
import { rateLimit } from "./rate-limit";
import {
  RESOURCES,
  createResource,
  deleteResource,
  findResource,
  listResource,
  updateResource,
  type ResourceKey,
} from "./resource";
import { listQuerySchema } from "./validation";

type RouteContext = { params: Promise<{ id: string }> };

function parseListQuery(request: Request) {
  const url = new URL(request.url);
  return listQuerySchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    scope: url.searchParams.get("scope") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
  });
}

function guardMutationRate(request: Request) {
  const limit = rateLimit(`mutate:${getClientIp(request)}`, 120, 60_000);
  if (!limit.allowed) {
    throw new HttpError(429, "Too many requests. Please slow down and try again shortly.");
  }
}

async function parseId(context: RouteContext): Promise<number> {
  const { id } = await context.params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric < 1) {
    throw new HttpError(400, "Invalid record identifier.");
  }
  return numeric;
}

export function resourceCollectionHandlers(key: ResourceKey) {
  const def = RESOURCES[key];

  return {
    GET: async (request: Request) => {
      try {
        const query = parseListQuery(request);
        const url = new URL(request.url);
        const wantsAdminView = url.searchParams.get("view") === "admin";
        const session = wantsAdminView ? await getSession() : null;
        if (wantsAdminView && !session) {
          return jsonError("Your session has expired. Please sign in again.", 401);
        }

        const result = await listResource(key, query, { adminView: Boolean(session) });
        return jsonOk(result.items, {
          meta: {
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            totalPages: result.totalPages,
          },
        });
      } catch (error) {
        return handleRouteError(`${key}.list`, error);
      }
    },

    POST: async (request: Request) => {
      try {
        guardMutationRate(request);
        const session = await requireAdmin(request);
        const body = await readJsonBody(request);
        const record = await createResource(key, body);
        await writeAuditLog({
          administratorId: session.admin.id,
          administratorEmail: session.admin.email,
          action: record.status === "PUBLISHED" ? "CREATE_AND_PUBLISH" : "CREATE",
          entityType: def.entityType,
          entityId: String(record.id),
          metadata: { title: record.title, status: record.status },
        });
        return jsonOk(record, { status: 201 });
      } catch (error) {
        return handleRouteError(`${key}.create`, error);
      }
    },
  };
}

export function resourceItemHandlers(key: ResourceKey) {
  const def = RESOURCES[key];

  const update = async (request: Request, context: RouteContext) => {
    try {
      guardMutationRate(request);
      const session = await requireAdmin(request);
      const id = await parseId(context);
      const body = await readJsonBody(request);
      const previous = await findResource(key, String(id), { adminView: true });
      const record = await updateResource(key, id, body);

      let action = "UPDATE";
      if (previous && previous.status !== record.status) {
        action = record.status === "PUBLISHED" ? "PUBLISH" : "UNPUBLISH";
      }

      await writeAuditLog({
        administratorId: session.admin.id,
        administratorEmail: session.admin.email,
        action,
        entityType: def.entityType,
        entityId: String(record.id),
        metadata: { title: record.title, status: record.status },
      });
      return jsonOk(record);
    } catch (error) {
      return handleRouteError(`${key}.update`, error);
    }
  };

  return {
    GET: async (request: Request, context: RouteContext) => {
      try {
        const { id } = await context.params;
        const session = await getSession();
        const record = await findResource(key, id, { adminView: Boolean(session) });
        if (!record) return jsonError(`${def.label} was not found.`, 404);
        return jsonOk(record);
      } catch (error) {
        return handleRouteError(`${key}.detail`, error);
      }
    },

    PUT: update,
    PATCH: update,

    DELETE: async (request: Request, context: RouteContext) => {
      try {
        guardMutationRate(request);
        const session = await requireAdmin(request);
        const id = await parseId(context);
        const record = await deleteResource(key, id);
        await writeAuditLog({
          administratorId: session.admin.id,
          administratorEmail: session.admin.email,
          action: "DELETE",
          entityType: def.entityType,
          entityId: String(id),
          metadata: { title: record.title },
        });
        return jsonOk({ id });
      } catch (error) {
        return handleRouteError(`${key}.delete`, error);
      }
    },
  };
}
