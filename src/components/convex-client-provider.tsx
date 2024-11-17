"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    // Setting use client doesn't mean the children will work as client...
  return (
    <ConvexAuthNextjsProvider client={convex}>
        {children}
    </ConvexAuthNextjsProvider>
  );
}