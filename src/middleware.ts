import { convexAuthNextjsMiddleware, createRouteMatcher, isAuthenticatedNextjs, nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";

// Initially the public page will be route to "/auth"...
const isPublicPage = createRouteMatcher(["/auth"]);

export default convexAuthNextjsMiddleware((request) => {
    // If we are not in public page as well not authenticated it redirects to sign in page...
    if(!isPublicPage(request) && !isAuthenticatedNextjs()) {
        return nextjsMiddlewareRedirect(request, "/auth")
    }

    //if we are in public page which is "/auth" and if it's authorized it redirects to root page...
    if(isPublicPage(request) && isAuthenticatedNextjs()) {
        return nextjsMiddlewareRedirect(request, "/")
    }
});
 
export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};