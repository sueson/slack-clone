import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";


// For to load all the replay messages to this message...
const populateThread = async (ctx : QueryCtx, messageId : Id<"messages">) => {
    const messages = await ctx.db
    .query("messages")
    .withIndex("by_parent_message_id", (q) => 
        q.eq("parentMessageId", messageId)
    )
    .collect();

    // This method gonna tell like how many replay you got 
    if(messages.length === 0) {
        return {
            count : 0,
            image : undefined,
            timestamp : 0,
            name : ""
        };
    }

    const lastMessage = messages[messages.length - 1];
    const lastMessageMember = await populateMember(ctx, lastMessage.memberId);

    if(!lastMessageMember) {
        return {
            count : 0,
            image : undefined,
            timestamp : 0,
            name : ""
        };
    }

    // To get user...
    const lastMessageUser = await populateUser(ctx, lastMessageMember.userId);

    // If have any message send by user...
    return {
        count : messages.length,
        image : lastMessageUser?.image,
        timestamp : lastMessage._creationTime,
        name : lastMessageUser?.name,
    }
}

// To get reactions...
const populateReactions = (ctx : QueryCtx, messageId : Id<"messages">) => {
    return ctx.db
    .query("reactions")
    .withIndex("by_message_id", (q) => q.eq("messageId", messageId))
    .collect();
}

// It used to load the user...
const populateUser = (ctx : QueryCtx, userId : Id<"users">) => {
    return ctx.db.get(userId);
}

// It used to load member...
const populateMember = (ctx : QueryCtx, memberId : Id<"members">) => {
    return ctx.db.get(memberId);
}

// It used to load with the combination of workspace and userId...
const getMember = async (
    ctx : QueryCtx,
    workspaceId : Id<"workspaces">,
    userId : Id<"users">
) => {
    return ctx.db
    .query("members")
    .withIndex("by_workspace_id_user_id", (q) => 
        q.eq("workspaceId", workspaceId).eq("userId", userId)
    )
    .unique();
}


export const update = mutation({
    args : {
        id : v.id("messages"),
        body : v.string(),
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized");
        }

        const message = await ctx.db.get(args.id)

        if(!message) {
            throw new Error("Message not found");
        }

        const member = await getMember(ctx, message.workspaceId, userId);

        if(!member || member._id !== message.memberId){
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.id, {
            body : args.body,
            updatedAt : Date.now()
        });

        return args.id;
    }
})


// To delete..
export const remove = mutation({
    args : {
        id : v.id("messages"),
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized");
        }

        const message = await ctx.db.get(args.id)

        if(!message) {
            throw new Error("Message not found");
        }

        const member = await getMember(ctx, message.workspaceId, userId);

        if(!member || member._id !== message.memberId){
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);

        return args.id;
    }
})


// To get individual message...
export const getById = query({
    args : {
        id : v.id("messages")
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            return null;
        }

        const message = await ctx.db.get(args.id);

        if(!message) {
            return null;
        }

        // It's the member who accessing the message..
        const currentMember = await getMember(ctx, message.workspaceId, userId);

        if(!currentMember) {
            return null;
        }

        // It's the member who wrote the message...
        const member = await populateMember(ctx, message.memberId);

        if(!member) {
            return null;
        }

        const user = await populateUser(ctx, member.userId);

        if(!user) {
            return null;
        }

        const reactions = await populateReactions(ctx, message._id);

        // For counting the each reactions for message e.g. if user using fire emoji it should count total no.of fire emojis for a message....
        // But in this one each reaction have counts like 😀(1) and again 😀(1) so have to combine this into one....
        const reactionsWithCounts = reactions.map((reaction) => {
            return {
                ...reaction,
                count : reactions.filter((r) => r.value === reaction.value).length
            }
        });

        // So to combine the emojis and make it on one...
        const dedupedReactions = reactionsWithCounts.reduce((acc, reaction) => {
            const existingReaction = acc.find(
                (r) => r.value === reaction.value,
            )

            // To remove the duplicates ( if already had )...
            if(existingReaction) {
                existingReaction.memberIds = Array.from(
                    new Set([...existingReaction.memberIds, reaction.memberId])
                );
            }else {
                // To push new member id...
                acc.push({...reaction, memberIds : [reaction.memberId]});
            }

            return acc;
            },
            // It's an type for initial value for reduce without this typescript shows error...
            [] as (Doc<"reactions"> & {
                count : number;
                memberIds : Id<"members">[];
            })[]
        );

        // To remove the memberId, because the frontend doesn't need to show it...
        const reactionsWithoutMemberIdProperty = dedupedReactions.map(
            // So in here only returing rest without memberId....
            ({ memberId, ...rest }) => rest
        );

        return {
            ...message,
            image : message.image
                ? await ctx.storage.getUrl(message.image)
                : undefined,
            user,
            member,
            reactions : reactionsWithoutMemberIdProperty,
        }
    }
})


// To get message...
export const get = query({
    args : {
        channelId : v.optional(v.id("channels")),
        conversationId : v.optional(v.id("conversations")),
        parentMessageId : v.optional(v.id("messages")),

        // Used to have lot of messages by user like unlimited, so to handle that convex have ( paginations options )...
        paginationOpts : paginationOptsValidator
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized");
        }

        let _conversationId = args.conversationId;

        // Way to get the conversationId...
        if(!args.conversationId && !args.channelId && args.parentMessageId) {
            const parentMessage = await ctx.db.get(args.parentMessageId);

            if(!parentMessage) {
                throw new Error("Parent message not found");
            }

            _conversationId = parentMessage.conversationId;
        }

        const results = await ctx.db
        .query("messages")
        .withIndex("by_channel_id_parent_message_id_conversation_id", (q) => 
            q
                .eq("channelId", args.channelId)
                .eq("parentMessageId", args.parentMessageId)
                .eq("conversationId", _conversationId)
        )
        .order("desc")
        // args.paginationOpts typically includes details like pageSize (how many items to load per page)...
        .paginate(args.paginationOpts);

        return {
            ...results,
            page : (
                // Since using Promise so we can use async method....
                await Promise.all(
                    results.page.map(async (message) => {
                        const member = await populateMember(ctx, message.memberId);
                        const user = member ? await populateUser(ctx, member.userId) : null;

                        if(!member || !user) {
                            return null;
                        }


                        const reactions = await populateReactions(ctx, message._id);
                        // thread is an replay message of user..
                        const thread = await populateThread(ctx, message._id);
                        // since the _storage is not an url which is used to create id of image, so following this way to get image...
                        const image = message.image
                            ? await ctx.storage.getUrl(message.image)
                            : undefined; 
                        
                        // For counting the each reactions for message e.g. if user using fire emoji it should count total no.of fire emojis for a message....
                        // But in this one each reaction have counts like 😀(1) and again 😀(1) so have to combine this into one....
                        const reactionsWithCounts = reactions.map((reaction) => {
                            return {
                                ...reaction,
                                count : reactions.filter((r) => r.value === reaction.value).length
                            }
                        })

                        // So to combine the emojis and make it on one...
                        const dedupedReactions = reactionsWithCounts.reduce((acc, reaction) => {
                            const existingReaction = acc.find(
                                (r) => r.value === reaction.value,
                            )

                            // To remove the duplicates ( if already had )...
                            if(existingReaction) {
                                existingReaction.memberIds = Array.from(
                                    new Set([...existingReaction.memberIds, reaction.memberId])
                                );
                            }else {
                                // To push new member id...
                                acc.push({...reaction, memberIds : [reaction.memberId]});
                            }

                            return acc;
                        },
                        // It's an type for initial value for reduce without this typescript shows error...
                        [] as (Doc<"reactions"> & {
                            count : number;
                            memberIds : Id<"members">[];
                        })[]
                    );

                    // To remove the memberId, because the frontend doesn't need to show it...
                    const reactionsWithoutMemberIdProperty = dedupedReactions.map(
                        // So in here only returing rest without memberId....
                        ({ memberId, ...rest }) => rest
                    );

                    
                    return {
                        ...message,
                        image,
                        member,
                        user,
                        reactions : reactionsWithoutMemberIdProperty,
                        threadCount : thread.count,
                        threadImage : thread.image,
                        threadName : thread.name,
                        threadTimestamp : thread.timestamp
                    };

                    })
                )
            ).filter(
                // have to mention type of message or will face kind of type errors...
                (message) : message is NonNullable<typeof message> => message !== null
            )
        };
    }
})


// To post / create message....
export const create = mutation({
    args : {
        body : v.string(),
        image : v.optional(v.id("_storage")),
        workspaceId : v.id("workspaces"),
        channelId : v.optional(v.id("channels")),
        conversationId : v.optional(v.id("conversations")),
        parentMessageId : v.optional(v.id("messages")),
    },
    handler : async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorized");
        }

        // why args.workspace but not args.userId, because workspaceId is inside args and usedId is outside args and inside handler so we can directly access that...
        const member = await getMember(ctx, args.workspaceId, userId);

        if(!member) {
            throw new Error("Unauthorized");
        }

        let _conversationId = args.conversationId;

        // It's only possible if we are replying a thread in one on one conversation...
        if(!args.conversationId && !args.channelId && args.parentMessageId) {
            // in here parent message will be the one who sends the message first...
            const parentMessage = await ctx.db.get(args.parentMessageId);

            if(!parentMessage) {
                throw new Error("Parent message not found");
            }

            _conversationId = parentMessage.conversationId;
        }

        const messageId = await ctx.db.insert("messages", {
            memberId : member._id,
            body : args.body,
            image : args.image,
            channelId : args.channelId,
            conversationId : _conversationId,
            workspaceId : args.workspaceId,
            parentMessageId : args.parentMessageId,
        });

        return messageId;
    }
})


