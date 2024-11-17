import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const current = query({
    // args defines what input parameters the query can accept...
    args: {},
    // handler contains the logic that the query performs when called, making use of the context (ctx) to access things like the database and authentication...
    handler: async(ctx) => {
        const userId = await getAuthUserId(ctx);
        if(userId === null) {
            return null
        }

        return await ctx.db.get(userId);
    }
})