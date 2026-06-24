import { useState } from 'react';

export function useInvoices() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
