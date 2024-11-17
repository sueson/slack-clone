import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const generateCode = () => {
    const code = Array.from(
        {length : 6},
        () => 
            "0123456789abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() *36)]
        // After generating an array of 6 random characters, .join("") concatenates those characters into a single string without any separator...
    ).join("");

    return code;
}


// For existing and new member to join using join code...
export const join = mutation({
    args : {
        joincode : v.string(),
        workspaceId : v.id("workspaces")
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized");
        }
        
        const workspace = await ctx.db.get(args.workspaceId);

        if(!workspace) {
            throw new Error("Workspace not found");
        }

        if(workspace.joincode !== args.joincode.toLowerCase()) {
            throw new Error("Invalid join code");
        }

        const existingMember = await ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
        )
        .unique();

        if(existingMember) {
            throw new Error("Already a member of this workspace");
        }

        await ctx.db.insert("members", {
            userId,
            workspaceId : workspace._id,
            role : "member"
        })

        return workspace._id;
    }
})

// If admin want to reset the joincode...
export const newJoinCode = mutation({
    args : {
        workspaceId : v.id("workspaces")
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized");
        }

        const member = await ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
        )
        .unique();

        if(!member || member.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const joincode = generateCode();

        await ctx.db.patch(args.workspaceId, {
            joincode
        })

        return args.workspaceId;
    }
})

// Mutation used to edit data...
export const create = mutation({
    args: {
        name : v.string()
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized");
        }

        const joincode = generateCode();

        // insert used to create a new data in a database...
        const workspaceId = await ctx.db.insert("workspaces", {
            name : args.name,
            userId,
            joincode,
        })

        // So if we creating a new workspace it would insert these fields on the database as well it creates fields on workspace table...
        await ctx.db.insert("members", {
            userId,
            workspaceId,
            role : "admin"
        })

        await ctx.db.insert("channels", {
            name : "general",
            workspaceId
        })

        return workspaceId;
    }
})

//Query used to read data...
export const get = query({
    args : {},
    handler : async (ctx) => {
        const userId = await getAuthUserId(ctx);

        // In query we can't use throw new error like mutation...
        if(!userId) {
            return [];
        }

        const members = await ctx.db
        .query("members")
        // for this we wrote the index in schema to find results faster by specifying the name, So in here use withInex and put the name given in index...
        // q.eq("userId", userId) means you're asking the database to find records where the userId field matches a specific userId value. It’s like saying, "Find all members with this specific user ID."...
        // q - means query name and eq - means equals to...
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        // Finally, collect() gathers all the results from the query and returns them as an array...
        .collect();

        const workspaceIds = members.map((member) => member.workspaceId);

        const workspaces = [];

        for(const workspaceId of workspaceIds) {
            const workspace = await ctx.db.get(workspaceId);

            if(workspace) {
                workspaces.push(workspace);
            }
        }

        return workspaces;
    }
})


// To get workspace info...
export const getInfoById = query ({
    args : {
        id : v.id("workspaces")
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            return null;
        }

        const member = await ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.id).eq("userId", userId))
        // Using unique to get single member workspace belongs to userid...
        .unique();

        const workspace = await ctx.db.get(args.id);

        return {
            name : workspace?.name,
            // double exlamation makes this into boolen value like true or false...
            isMember : !!member
        }
    }
})


export const getById = query({
    args : {id : v.id("workspaces")},
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            return null;
        }

        const member = await ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.id).eq("userId", userId))
        // Using unique to get single member workspace belongs to userid...
        .unique();

        if(!member) {
            return null;
        }

        return await ctx.db.get(args.id);
    }
})

// For update...
export const update = mutation({
    args : {
        id : v.id("workspaces"),
        name : v.string(),
    },
    handler : async(ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized")
        }

        const member = await ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.id).eq("userId", userId))
        // Using unique to get single member workspace belongs to userid...
        .unique();

        if(!member || member.role !== "admin") {
            throw new Error ("Unauthorized");
        }

        // patch for update...
        await ctx.db.patch(args.id, {
            name : args.name
        });

        return args.id;
    }
})


// For delete...
export const remove = mutation({
    args : {
        id : v.id("workspaces")
    },
    handler : async(ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized")
        }

        const member = await ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.id).eq("userId", userId))
        // Using unique to get single member workspace belongs to userid...
        .unique();

        if(!member || member.role !== "admin") {
            throw new Error ("Unauthorized");
        }

        // To remove all this along with workspaces...
        const [members, channels, conversations, messages, reactions] = await Promise.all([
            ctx.db
                .query("members")
                .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id))
                .collect(),
            ctx.db
                .query("channels")
                .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id))
                .collect(),
            ctx.db
                .query("conversations")
                .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.id))
                .collect(),
            ctx.db
                .query("messages")
                .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id))
                .collect(),
            ctx.db
                .query("reactions")
                .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id))
                .collect(),
        ])

        for(const member of members) {
            await ctx.db.delete(member._id);
        }

        for(const channel of channels) {
            await ctx.db.delete(channel._id);
        }

        for(const conversation of conversations) {
            await ctx.db.delete(conversation._id);
        }

        for(const message of messages) {
            await ctx.db.delete(message._id);
        }

        for(const reaction of reactions) {
            await ctx.db.delete(reaction._id);
        }

        // for delete...
        await ctx.db.delete(args.id);

        return args.id;
    }
})