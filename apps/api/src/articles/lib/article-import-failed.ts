import { UnprocessableEntityException } from '@nestjs/common';

export function importFailed(message: string): never {
  throw new UnprocessableEntityException({ code: 'ARTICLE_IMPORT_FAILED', message });
}
