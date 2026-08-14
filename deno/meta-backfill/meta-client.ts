const GRAPH_API_VERSION = "v21.0";
const GRAPH_HOST = "https://graph.instagram.com";

export interface MetaConfig {
  accessToken: string;
  instagramAccountId: string;
}

export interface MetaConversation {
  id: string;
  participants?: { data: Array<{ id: string; username?: string }> };
}

export interface MetaMessage {
  id: string;
  message?: string;
  created_time: string;
  from?: { id: string };
}

export interface MetaMedia {
  id: string;
}

export interface MetaComment {
  id: string;
  text?: string;
  timestamp: string;
  username?: string;
  from?: { id: string; username?: string };
  parent_id?: string;
  replies?: { data: MetaComment[] };
}

export class MetaRequestError extends Error {
  constructor(public code: string, public rateLimited: boolean) {
    super(code);
  }
}

function requestSignal(deadline: number): AbortSignal {
  const remaining = Math.max(1, deadline - Date.now());
  return AbortSignal.timeout(Math.min(10_000, remaining));
}

async function fetchPage<T>(
  url: string,
  deadline: number,
  fetcher: typeof fetch,
): Promise<{ data: T[]; next: string | null }> {
  let response: Response;
  try {
    response = await fetcher(url, { signal: requestSignal(deadline) });
  } catch {
    throw new MetaRequestError("meta_request_timeout", false);
  }
  if (!response.ok) {
    let code: number | undefined;
    try {
      const body = await response.json() as { error?: { code?: number } };
      code = body.error?.code;
    } catch {
      // Keep provider response bodies out of logs.
    }
    const rateLimited = response.status === 429 ||
      [4, 17, 32, 613].includes(code ?? -1);
    throw new MetaRequestError(
      rateLimited ? "meta_rate_limited" : `meta_http_${response.status}`,
      rateLimited,
    );
  }
  const body = await response.json() as {
    data?: T[];
    paging?: { next?: string };
  };
  return { data: body.data ?? [], next: body.paging?.next ?? null };
}

async function fetchAll<T>(
  url: string,
  deadline: number,
  fetcher: typeof fetch,
): Promise<T[]> {
  const rows: T[] = [];
  let next: string | null = url;
  while (next) {
    if (Date.now() >= deadline) {
      throw new MetaRequestError("batch_deadline", false);
    }
    const page: { data: T[]; next: string | null } = await fetchPage<T>(
      next,
      deadline,
      fetcher,
    );
    rows.push(...page.data);
    next = page.next;
  }
  return rows;
}

function tokenizedUrl(
  path: string,
  fields: string,
  config: MetaConfig,
): string {
  const url = new URL(`${GRAPH_HOST}/${GRAPH_API_VERSION}/${path}`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", "50");
  url.searchParams.set("access_token", config.accessToken);
  return url.toString();
}

export function listConversations(
  config: MetaConfig,
  deadline: number,
  fetcher = fetch,
) {
  const url = new URL(
    tokenizedUrl(
      `${config.instagramAccountId}/conversations`,
      "participants",
      config,
    ),
  );
  url.searchParams.set("platform", "instagram");
  return fetchAll<MetaConversation>(url.toString(), deadline, fetcher);
}

export function listMessages(
  config: MetaConfig,
  conversationId: string,
  deadline: number,
  fetcher = fetch,
) {
  return fetchAll<MetaMessage>(
    tokenizedUrl(
      conversationId + "/messages",
      "id,message,created_time,from",
      config,
    ),
    deadline,
    fetcher,
  ).then((messages) => messages.reverse());
}

export function listMedia(
  config: MetaConfig,
  deadline: number,
  fetcher = fetch,
) {
  return fetchAll<MetaMedia>(
    tokenizedUrl(config.instagramAccountId + "/media", "id", config),
    deadline,
    fetcher,
  );
}

export async function listComments(
  config: MetaConfig,
  mediaId: string,
  deadline: number,
  fetcher = fetch,
) {
  const topLevel = await fetchAll<MetaComment>(
    tokenizedUrl(
      mediaId + "/comments",
      "id,text,timestamp,username,from,replies{id,text,timestamp,username,from}",
      config,
    ),
    deadline,
    fetcher,
  );
  return topLevel.flatMap((comment) => [
    comment,
    ...(comment.replies?.data ?? []).map((reply) => ({
      ...reply,
      parent_id: comment.id,
    })),
  ]);
}
