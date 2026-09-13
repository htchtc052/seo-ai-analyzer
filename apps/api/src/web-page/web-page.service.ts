import { Injectable, UnprocessableEntityException } from '@nestjs/common';

const TIMEOUT_MS = 10_000;
const MAX_LENGTH = 5 * 1024 * 1024;

@Injectable()
export class WebPageService {
  async fetchHtml(url: string): Promise<string> {
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    const response = await fetch(url, { signal }).catch(loadFailed);
    if (response.status !== 200) pageFetchFailed(`The page responded with HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') ?? '';
    if (!/^(text\/html|application\/xhtml\+xml)\b/i.test(contentType)) {
      pageFetchFailed(`Expected an HTML page, got ${contentType || 'no content type'}`);
    }

    const html = await response.text().catch(loadFailed);
    if (html.length > MAX_LENGTH) pageFetchFailed('The page is larger than 5 MB');
    return html;
  }
}

function loadFailed(error: Error): never {
  const cause = error.cause instanceof Error ? error.cause.message : error.message;
  pageFetchFailed(`Could not load the page: ${cause}`);
}

function pageFetchFailed(message: string): never {
  throw new UnprocessableEntityException({ code: 'PAGE_FETCH_FAILED', message });
}
