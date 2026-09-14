import { ofetch } from 'ofetch';

type ApiErrorBody = { error?: { message?: string } };

export const apiClient = ofetch.create({
  baseURL: '/api',
  onResponseError({ response }) {
    const body = response._data as ApiErrorBody | undefined;
    throw new Error(body?.error?.message ?? `Request failed (${response.status})`);
  },
});
