export function getPagination(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function getPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
