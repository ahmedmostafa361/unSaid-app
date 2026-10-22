export const buildPagination = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
});

export const skipFor = (page, limit) => (page - 1) * limit;
