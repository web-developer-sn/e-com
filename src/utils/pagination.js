const paginate = async (query, { page = 1, limit = 20, sort = 'created_at:desc' }) => {
  const offset = (page - 1) * limit;
  const [sortField, sortOrder] = sort.split(':');
  const orderBy = sortOrder === 'desc' ? 'desc' : 'asc';
  const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
  const [{ total }] = await countQuery;
  const data = await query
    .orderBy(sortField, orderBy)
    .limit(limit)
    .offset(offset);
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

const buildFilters = (query, filters) => {
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        query.whereIn(key, value);
      } else if (typeof value === 'object' && value.operator) {
        query.where(key, value.operator, value.value);
      } else {
        query.where(key, value);
      }
    }
  });
  
  return query;
};

module.exports = {
  paginate,
  buildFilters
};

