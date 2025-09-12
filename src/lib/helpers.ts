export const formatCurrency = (amount: number, options?: { symbol?: string }) => {
  const defaultOptions = {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  const formatted = new Intl.NumberFormat('en-IN', defaultOptions).format(amount);

  if (options?.symbol === '') {
    return formatted.replace(/₹/g, '').trim();
  }
  if (options?.symbol) {
    return formatted.replace('₹', options.symbol).trim();
  }

  return formatted;
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
