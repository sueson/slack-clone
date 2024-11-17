import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
    ...authTables,

    workspaces : defineTable({
        name : v.string(),
        userId : v.id('users'),
        joincode : v.string()
    }),

    members : defineTable({
        userId : v.id("users"),
        workspaceId : v.id("workspaces"),
        // role: Stores the role of the user in the workspace. The role can be either "admin" or "member"...
        // The v.union() function is useful when a field needs to accept more than one type or value...
        role : v.union(v.literal("admin"), v.literal("member"))
    })
    // index helps to find or filter out by specific names, and gives what we need instead of looking all over the database...
    .index("by_user_id", ["userId"])
    .index("by_workspace_id", ["workspaceId"])
    // This index for to get the workspace which belongs to the user who created and not to get all the other users workspaces
    // for that reason making this index by both workspaceid and userid...
    .index("by_workspace_id_user_id", ["workspaceId", "userId"]),

    channels : defineTable({
        name : v.string(),
        workspaceId : v.id("workspaces")
    })
    .index("by_workspace_id", ["workspaceId"]),

    conversations : defineTable({
        workspaceId : v.id("workspaces"),
        // It doesn't matter which is the first one or second one...
        // But anyway memberOne gonna intialize the coversation...
        memberOneId : v.id("members"),
        memberTwoId : v.id("members")
    })
    .index("by_workspaceId", ["workspaceId"]),

    messages : defineTable({
        body : v.string(),
        image : v.optional(v.id("_storage")),
        memberId : v.id("members"),
        workspaceId : v.id("workspaces"),
        channelId : v.optional(v.id("channels")),
        parentMessageId : v.optional(v.id("messages")),
        conversationId : v.optional(v.id("conversations")),
        updatedAt : v.optional(v.number()),
    })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_id", ["memberId"])
    .index("by_channel_id", ["channelId"])
    .index("by_conversation_id", ["conversationId"])
    .index("by_parent_message_id", ["parentMessageId"])
    .index("by_channel_id_parent_message_id_conversation_id", [
        "channelId",
        "parentMessageId",
        "conversationId"
    ]),

    reactions : defineTable({
        workspaceId : v.id("workspaces"),
        messageId : v.id("messages"),
        memberId : v.id("members"),
        value : v.string()
    })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_message_id", ["messageId"])
    .index("by_member_id", ["memberId"])
});

export default schema;