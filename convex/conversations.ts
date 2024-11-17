import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";


// For user to user conversation or can create a new conversation with a new user....


export const createOrGet = mutation ({
    args : {
        memberId : v.id("members"),
        workspaceId : v.id("workspaces"),
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized");
        }

        // Only member in this workspace used to create the conversations...
        // This is we...
        const currentMember = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", userId) 
            )
            .unique();

        // This is other members... 
        const otherMember = await ctx.db.get(args.memberId);

        if(!currentMember || !otherMember) {
            throw new Error("Member not found");
        }

        const existingConversation = await ctx.db
            .query("conversations")
            // Have no idea abot who is the first member try to communicate, so following this method..
            .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
            .filter((q) => 
                q.or(
                    // The whole point is depends on who initiated the conversation...
                    q.and(
                        // Checks that if memberOneId matches the currentMember...
                        q.eq(q.field("memberOneId"), currentMember._id),
                        q.eq(q.field("memberTwoId"), otherMember._id),
                    ),
                    q.and(
                        // Checks that if memberOneId matches the currentMember...
                        q.eq(q.field("memberOneId"), otherMember._id),
                        q.eq(q.field("memberTwoId"), currentMember._id),
                    )
                )
            )
            .unique();

        // If have the existing one it will return the entire conversations...
        if(existingConversation) {
            return existingConversation._id;
        }

        // For new conversation...
        const conversationId = await ctx.db.insert("conversations", {
            workspaceId : args.workspaceId,
            memberOneId : currentMember._id,
            memberTwoId : otherMember._id,
        });

        return conversationId;
    }
})