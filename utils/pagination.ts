// utils/pagination.ts - Pagination Utilities

export interface PaginationResult<T> {
  data: T[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const paginate = <T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10
): PaginationResult<T> => {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const data = items.slice(start, end);

  return {
    data,
    currentPage: page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const getPaginationPages = (
  currentPage: number,
  totalPages: number,
  maxPagesToShow: number = 5
): number[] => {
  const pages: number[] = [];
  let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let end = Math.min(totalPages, start + maxPagesToShow - 1);

  if (end - start + 1 < maxPagesToShow) {
    start = Math.max(1, end - maxPagesToShow + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
};
