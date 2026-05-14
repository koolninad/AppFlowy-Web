import { AppOutlineResponse } from '@/application/services/services.type';
import { View } from '@/application/types';

import { APIResponse, executeAPIRequest, getAxios } from './core';

interface PageCollabResponse {
  view: View;
}

interface FolderViewResponse {
  view_id: string;
  name: string;
  icon: View['icon'] | null;
  is_space: boolean;
  is_private: boolean;
  is_published: boolean;
  is_favorite: boolean;
  layout: number;
  created_at: string;
  last_edited_time: string;
  extra: View['extra'];
  access_level?: number;
  workspace_id?: string;
  children: FolderViewResponse[];
}

function folderViewToView(fv: FolderViewResponse): View {
  return {
    view_id: fv.view_id,
    name: fv.name,
    icon: fv.icon,
    layout: fv.layout as View['layout'],
    extra: fv.extra,
    children: (fv.children || []).map(folderViewToView),
    is_published: fv.is_published,
    is_private: fv.is_private,
    last_edited_time: fv.last_edited_time,
    created_at: fv.created_at,
    access_level: fv.access_level as View['access_level'],
    workspace_id: fv.workspace_id,
  };
}

export async function getAppOutline(workspaceId: string): Promise<AppOutlineResponse> {
  const url = `/api/workspace/${workspaceId}/folder?depth=10&root_view_id=${workspaceId}`;

  const root = await executeAPIRequest<FolderViewResponse>(() =>
    getAxios()?.get<APIResponse<FolderViewResponse>>(url)
  );

  return {
    outline: (root.children || []).map(folderViewToView),
    folderRid: root.view_id,
  };
}

export async function getView(workspaceId: string, viewId: string, _depth: number = 1) {
  const url = `/api/workspace/${workspaceId}/page-view/${viewId}`;

  return executeAPIRequest<PageCollabResponse>(() =>
    getAxios()?.get<APIResponse<PageCollabResponse>>(url)
  ).then((data) => data.view);
}

export async function getViews(workspaceId: string, viewIds: string[], depth: number = 2) {
  if (viewIds.length === 0) return [];

  const query = new URLSearchParams({
    depth: String(depth),
    view_ids: viewIds.join(','),
  });
  const url = `/api/workspace/${workspaceId}/views?${query.toString()}`;

  return executeAPIRequest<{ views: View[] }>(() =>
    getAxios()?.get<APIResponse<{ views: View[] }>>(url)
  ).then((data) => data.views ?? []);
}

export async function getAppFavorites(workspaceId: string) {
  const url = `/api/workspace/${workspaceId}/favorite`;

  return executeAPIRequest<{ views: View[] }>(() =>
    getAxios()?.get<APIResponse<{ views: View[] }>>(url)
  ).then((data) => data.views);
}

export async function getAppRecent(workspaceId: string) {
  const url = `/api/workspace/${workspaceId}/recent`;

  return executeAPIRequest<{ views: View[] }>(() =>
    getAxios()?.get<APIResponse<{ views: View[] }>>(url)
  ).then((data) => data.views);
}

export async function getAppTrash(workspaceId: string) {
  const url = `/api/workspace/${workspaceId}/trash`;

  return executeAPIRequest<{ views: View[] }>(() =>
    getAxios()?.get<APIResponse<{ views: View[] }>>(url)
  ).then((data) => data.views);
}

export async function createOrphanedView(workspaceId: string, payload: { document_id: string }): Promise<Uint8Array> {
  const url = `/api/workspace/${workspaceId}/orphaned-view`;

  // Server returns doc_state as Vec<u8> which is JSON encoded as number[]
  const docStateArray = await executeAPIRequest<number[] | null>(() =>
    getAxios()?.post<APIResponse<number[] | null>>(url, payload)
  );

  // Validate the response - server must return a valid doc_state array
  if (!docStateArray || !Array.isArray(docStateArray)) {
    throw new Error('Server returned invalid doc_state');
  }

  return new Uint8Array(docStateArray);
}

export async function checkIfCollabExists(workspaceId: string, objectId: string) {
  const url = `/api/workspace/${workspaceId}/collab/${objectId}/collab-exists`;

  const payload = await executeAPIRequest<{ exists: boolean }>(() =>
    getAxios()?.get<APIResponse<{ exists: boolean }>>(url)
  );

  return payload.exists;
}
