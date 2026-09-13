# ADR-0003: Общие Zod-контракты вместо DTO-классов

Zod-схемы в packages/contracts — единственное описание API. Бэкенд проверяет ими вход (ZodValidationPipe) и очищает ответ (глобальный ZodSerializerInterceptor по @ResponseSchema), фронтенд выводит из них типы и валидирует форму анализа через react-hook-form и zodResolver. Правила полей и тексты ошибок одни и те же на обеих сторонах.

Компромисс — стандартные class-validator и class-transformer из экосистемы Nest не используются.
