"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

type GetUrlTypes =
  | "fullWithQuery"
  | "fullWithNoQuery"
  | "pathname"
  | "origin"
  | "pathWithQuery";

export default function useQueryParams<T>() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setQueryParams = useCallback(
    (params: Partial<T>, url?: string, prependPathname: boolean = true) => {
      const usp = new URLSearchParams(searchParams?.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          usp.delete(key);
        } else {
          usp.set(key, String(value));
        }
      });

      const search = usp.toString();
      const query = search ? `?${search}` : "";
      let tempUrl = prependPathname ? pathname : "";
      if (url && url.length > 0) {
        tempUrl += url[0] === "/" ? url : "/" + url;
      }

      // replace since we don't want to build a history
      router.replace(`${tempUrl}${query}`);
    },
    [searchParams, pathname, router],
  );

  const setUrl = useCallback(
    (url: string) => {
      router.push(url);
    },
    [router],
  );

  const getUrl = useCallback(
    ({ type }: { type: GetUrlTypes }) => {
      // if (typeof window !== "undefined") {
      const query = searchParams?.toString();
      const search = query ? `?${query}` : "";

      if (type === "pathWithQuery") {
        return pathname + search;
      } else if (type === "pathname") {
        return pathname;
      } else if (type === "fullWithQuery") {
        return typeof window !== "undefined"
          ? window.location.origin + pathname + search
          : undefined;
      } else if (type === "fullWithNoQuery") {
        return typeof window !== "undefined"
          ? window.location.origin + pathname
          : undefined;
      } else if (type === "origin") {
        return typeof window !== "undefined"
          ? window.location.origin
          : undefined;
      }
      // }
    },
    [pathname, searchParams],
  );

  return {
    queryParams: searchParams,
    setQueryParams,
    getUrl,
    setUrl,
  };
}
