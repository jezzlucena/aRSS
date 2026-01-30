import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  /** Whether there are more pages to load */
  hasNextPage: boolean | undefined;
  /** Whether a fetch is currently in progress */
  isFetchingNextPage: boolean;
  /** Function to fetch the next page */
  fetchNextPage: () => void;
  /** Intersection observer threshold (0-1) */
  threshold?: number;
  /** Root margin for the intersection observer */
  rootMargin?: string;
}

/**
 * Hook to implement infinite scroll behavior using IntersectionObserver.
 * Returns a ref to attach to the "load more" trigger element.
 *
 * @example
 * ```tsx
 * const loadMoreRef = useInfiniteScroll({
 *   hasNextPage,
 *   isFetchingNextPage,
 *   fetchNextPage,
 * });
 *
 * return (
 *   <>
 *     {items.map(item => <ItemCard key={item.id} item={item} />)}
 *     <div ref={loadMoreRef} />
 *   </>
 * );
 * ```
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 0.1,
  rootMargin = '0px',
}: UseInfiniteScrollOptions) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold, rootMargin }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold, rootMargin]);

  return loadMoreRef;
}
