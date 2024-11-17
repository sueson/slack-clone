import { mutation } from "./_generated/server";


// For image upload...
export const generatedUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
})