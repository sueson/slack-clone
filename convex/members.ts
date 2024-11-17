import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// To get members
const populateUser = (ctx : QueryCtx, id : Id<"users">) => {
    return ctx.db.get(id);
}


// For get individual member...
export const getById = query({
    args : { id : v.id("members") },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            return null;
        }

        const member = await ctx.db.get(args.id);

        if(!member) {
            return null;
        }

        // To check wheather the current member exists...
        const currentMember = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) => 
                q.eq("workspaceId", member.workspaceId).eq("userId", userId)
            )
        if(!currentMember) {
            return null;
        }

        const user = await populateUser(ctx, member.userId);

        if(!user) {
            return null;
        }

        return {
            ...member,
            user
        }
    }
})



export const get = query({
    args : {workspaceId : v.id("workspaces")},
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        // This query always return array so using [] instead of null...
        if(!userId) {
            return [];
        }

        const member = await ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id", (q) => 
            q.eq("workspaceId", args.workspaceId).eq("userId", userId)
        )
        // Using unique to get single member workspace belongs to userid...
        .unique();

        if(!member) {
            return [];
        }

        const data = await ctx.db
        .query ("members")
        .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();

        const members = [];

        for(const member of data) {
            const user = await populateUser(ctx, member.userId);

            // It will add user into members bucket...
            if(user) {
                members.push({
                    ...member,
                    user
                })
            }
        }

        return members;
    }
})


export const current = query({
    args : {workspaceId : v.id("workspaces")},
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            return null;
        }

        const member = await ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id", (q) => 
            q.eq("workspaceId", args.workspaceId).eq("userId", userId)
        )
        // Using unique to get single member workspace belongs to userid...
        .unique();

        if(!member) {
            return null;
        }

        return member;
    }
})


// Update member profile...
export const update = mutation({
    args : {
        id : v.id("members"),
        // For to update the role of member...
        role : v.union(v.literal("admin"), v.literal("member"))
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized");
        }

        const member = await ctx.db.get(args.id);

        if(!member) {
            throw new Error("Member not found");
        }

        const currentMember = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", member.workspaceId).eq("userId", userId)
            )
            .unique();
        
        if(!currentMember || currentMember.role !== "admin") {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.id, {
            role : args.role
        })

        return args.id;
    }
})


// Delete member profile...
export const remove = mutation({
    args : {
        id : v.id("members"),
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized");
        }

        const member = await ctx.db.get(args.id);

        if(!member) {
            throw new Error("Member not found");
        }

        const currentMember = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", member.workspaceId).eq("userId", userId)
            )
            .unique();
        
        if(!currentMember) {
            throw new Error("Unauthorized");
        }

        if(member.role === "admin") {
            throw new Error("Admin cannot be removed");
        }

        // Can't remove ourselfs if role is admin...
        if(currentMember._id === args.id && currentMember.role == "admin") {
            throw new Error("Cannot remove self if self is an admin");
        }

        // Remove all the messages along with the member leaves...
        const [messages, reactions, conversations] = await Promise.all([
            ctx.db
                .query("messages")
                .withIndex("by_member_id", (q) => q.eq("memberId", member._id))
                .collect(),
            ctx.db
                .query("reactions")
                .withIndex("by_member_id", (q) => q.eq("memberId", member._id))
                .collect(),
            ctx.db
                .query("conversations")
                .filter((q) => q.or(
                    q.eq(q.field("memberOneId"), member._id),
                    q.eq(q.field("memberTwoId"), member._id),
                ))
                .collect(),
        ]);


        for(const message of messages) {
            await ctx.db.delete(message._id);
        }

        for(const reaction of reactions) {
            await ctx.db.delete(reaction._id);
        }

        for(const conversation of conversations) {
            await ctx.db.delete(conversation._id);
        }


        await ctx.db.delete(args.id);

        return args.id;
    }
})