export const createKeyedError = (statusCode: number, code: string, data?: Record<string, unknown>) => {
    return createError({
        statusCode,
        statusText: code,
        statusMessage: code,
        data: {
            code,
            ...(data ?? {}),
        },
    });
};
