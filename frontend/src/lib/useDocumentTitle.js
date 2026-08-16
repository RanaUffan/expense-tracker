import { useEffect } from 'react';

// Without this, every page shares the same static <title> from
// index.html — bad for SEO (search results/previews can't tell pages
// apart) and bad UX (every browser tab/history entry looks identical).
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Expense Tracker`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
