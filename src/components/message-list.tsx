import { GetMessagesReturnType } from "@/features/messages/api/use-get-messages";
// bun add date-fns...
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import { Message } from "./message";
import { ChannelHero } from "./channel-hero";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { Loader } from "lucide-react";
import { ConversationHero } from "./conversation-hero";


// For after 5 minutes a message sended by a user the isCompact will not work and the normal return will work...
const TIME_THRESHOLD = 5;

interface MessageListProps {
    memberName?: string;
    memberImage?: string;
    channelName?: string;
    channelCreationTime?: number;
    variant?: "channel" | "thread" | "conversation";
    data : GetMessagesReturnType | undefined;
    loadMore : () => void;
    isLoadingMore : boolean;
    canLoadMore : boolean;
}

// For to show the date on the top of message...
const formatDateLabel = (dateStr : string) => {
    const date = new Date(dateStr);

    if(isToday(date)) return "Today";
    if(isYesterday(date)) return "Yesterday";

    return format(date, "EEEE, MMMM, d");
}

export const MessageList = ({
    memberName,
    memberImage,
    channelName,
    channelCreationTime,
    data,
    variant = "channel",
    loadMore,
    isLoadingMore,
    canLoadMore
} : MessageListProps) => {
    const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

    const workspaceId = useWorkspaceId();

    const { data : currentMember } = useCurrentMember({ workspaceId });


    const groupedMessages = data?.reduce(
        (groups, message) => {
            const date = new Date(message._creationTime)
            const dateKey = format(date, "yyy-MM-dd");

            if(!groups[dateKey]) {
                groups[dateKey] = []
            }

            // unshift adds element at beginning...
            groups[dateKey].unshift(message);
            return groups;
        },
        // Initial value and it's type...
        {} as Record<string, typeof data>
    )

    
    return (
        <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
            {/* used to show the messages seperate by today or yesterday or date */}
            {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
                <div key={dateKey}>
                    <div className="text-center my-2 relative">
                        <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
                        <span  className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                            {formatDateLabel(dateKey)}
                        </span>
                    </div>
                    {messages.map((message, index) => {
                        const prevMessage = messages[index - 1];
                        const isCompact = 
                            prevMessage && 
                            // Checks previous message and the current message sended by user time is less than TIME_THRESHOLD, then isCompact will become true and the normal return will not work...
                            prevMessage.user?._id === message.user?._id && 
                            // it's from date-fns...
                            differenceInMinutes(
                                new Date(message._creationTime),
                                new Date(prevMessage._creationTime)
                            ) < TIME_THRESHOLD;
                        return (
                            <Message
                                key = {message._id}
                                id = {message._id}
                                memberId = {message.memberId}
                                authorImage = {message.user.image}
                                authorName = {message.user.name}
                                isAuthor = {message.memberId === currentMember?._id}
                                reactions = {message.reactions}
                                body = {message.body}
                                image = {message.image}
                                updatedAt = {message.updatedAt}
                                createdAt = {message._creationTime}
                                // isEditing works like which message we gonna edit...
                                isEditing = {editingId === message._id}
                                setEditingId = {setEditingId}
                                isCompact = {isCompact}
                                hideThreadButton = {variant === "thread"}
                                threadCount = {message.threadCount}
                                threadImage = {message.threadImage}
                                threadName = {message.threadName}
                                threadTimestamp = {message.threadTimestamp} 
                            />
                        )
                    })}
                </div>
            ))}

            {/* infinite messages load feature, by using observer */}
            <div
                className="h-1"
                ref={(el) => {
                    if(el) {
                        const observer = new IntersectionObserver(
                            ([entry]) => {
                                // canLoadMore is a prop...
                                if(entry.isIntersecting && canLoadMore) {
                                    loadMore();
                                }
                            },
                            { threshold : 1.0 }
                        );

                        observer.observe(el);
                        // IT will do a proper cleanup...
                        return () => observer.disconnect();
                    }
                }} 
            />
            {isLoadingMore && (
                // This div is a seperator style...
                <div className="text-center my-2 relative">
                    <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
                    <span  className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                        <Loader className="size-4 animate-spin" />
                    </span>
                </div>
            )}

            {/* This is for a hero section for every channel if were comes under this conditions */}
            {variant === "channel" && channelName && channelCreationTime && (
                <ChannelHero
                    name = {channelName}
                    creationTime = {channelCreationTime} 
                />
            )}

            {variant === "conversation" && (
                <ConversationHero
                    name = {memberName}
                    image = {memberImage} 
                />
            )}
        </div>
    )
}