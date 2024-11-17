import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";
import { AlertTriangle, Loader, XIcon } from "lucide-react";
import { useGetMessage } from "@/features/messages/api/use-get-message";
import { useGetMessages } from "@/features/messages/api/use-get-messages";
import { Message } from "@/components/message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Quill from "quill";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload";
import { useCreateMessage } from "../api/use-create-message";
import { useChannelId } from "@/hooks/use-channel-id";
import { toast } from "sonner";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";


// To dynamic import / render it...
const Editor = dynamic(() => import("@/components/editor"), { ssr : false });


// For after 5 minutes a message sended by a user the isCompact will not work and the normal return will work...
const TIME_THRESHOLD = 5;


interface ThreadProps {
    messageId : Id<"messages">
    onClose : () => void;
}

// For Editor...
type CreateMessageValues = {
    channelId : Id<"channels">;
    workspaceId : Id<"workspaces">;
    // It's an reply...
    parentMessageId : Id<"messages">;
    body : string;
    image : Id<"_storage"> | undefined;
}

// For to show the date on the top of message...
const formatDateLabel = (dateStr : string) => {
    const date = new Date(dateStr);

    if(isToday(date)) return "Today";
    if(isYesterday(date)) return "Yesterday";

    return format(date, "EEEE, MMMM, d");
}


export const Thread = ({ messageId, onClose } : ThreadProps) => {
    const channelId = useChannelId();

    const workspaceId = useWorkspaceId();

    const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

    // For Editor...
    const [editorKey, setEditorKey] = useState(0);
    const [isPending, setIsPending] = useState(false);

    const editorRef = useRef<Quill | null>(null);

    // For Editor...
    const { mutate : generateUploadUrl } = useGenerateUploadUrl();
    const { mutate : createMessage } = useCreateMessage();


    const { data : currentMember } = useCurrentMember({ workspaceId });
    const { data : message, isLoading : loadingMessage } = useGetMessage({ id : messageId });


    // To load messages...
    const { results, status, loadMore } = useGetMessages({
        channelId,
        // Using parentMessageId for to load only the message we gonna reply, not all the messages
        parentMessageId : messageId
    });

    // Like did in channelId / page...
    const canLoadMore= status === "CanLoadMore";
    const isLoadingMore = status === "LoadingMore";


    // Can also do onSubmit and onError and mutate method like other but with this method it would be easy as simple...
    const handleSubmit = async ({
        body,
        image
    } : {
        body : string;
        image : File | null;
    }) => {
        try {
            setIsPending(true);
            editorRef?.current?.enable(false);

            // By giving ( : ) checks the type of CreateMessageValues, which is mentioned on top in type...
            const values : CreateMessageValues = {
                channelId,
                workspaceId,
                parentMessageId : messageId,
                body,
                image : undefined
            };

            // If user submit the image...
            // Also to handle the upload image processes..
            if(image) {
                // If no url it also throw error by made it as true...
                const url = await generateUploadUrl({}, { throwError : true });

                if(!url) {
                    throw new Error("Url not found");
                }

                const result = await fetch(url, {
                    method : "POST",
                    headers : { "Content-Type" : image.type },
                    body : image
                })

                if(!result.ok) {
                    throw new Error("Failed to upload image");
                }

                // extracting storageId from json...
                const { storageId } = await result.json();

                values.image = storageId;
            }

            await createMessage(values, { throwError : true });
    
            // Every time the key changes the editor component erase the text inside once send button pressed...
            setEditorKey((prevKey) => prevKey + 1);
        }
        catch (error) {
            toast.error("Failed to send message");
        }
        finally {
            setIsPending(false);
            editorRef?.current?.enable(true);
        }
        
    }

    const groupedMessages = results?.reduce(
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
        {} as Record<string, typeof results>
    )

    if(loadingMessage || status === "LoadingFirstPage") {
        return (
            <div className="h-full flex flex-col">
                <div className="h-[49px] flex justify-center items-center px-4 border-b">
                    <p className="text-lg font-bold">
                        Thread
                    </p>
                    <Button onClick={onClose} size="iconSm" variant="ghost">
                        <XIcon className="size-5 stroke-[1.5]" />
                    </Button>
                </div>

                <div className="flex flex-col gap-y-2 h-full items-center justify-center">
                    <Loader className="size-5 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    };

    if(!message) {
        return (
            <div className="h-full flex flex-col">
                <div className="h-[49px] flex justify-center items-center px-4 border-b">
                    <p className="text-lg font-bold">
                        Thread
                    </p>
                    <Button onClick={onClose} size="iconSm" variant="ghost">
                        <XIcon className="size-5 stroke-[1.5]" />
                    </Button>
                </div>

                {/* Incase the message were deleted while the thread opened */}
                <div className="flex flex-col gap-y-2 h-full items-center justify-center">
                    <AlertTriangle className="size-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        Message not found
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div className="h-full flex flex-col">
            <div className="h-[49px] flex justify-center items-center px-4 border-b">
                <p className="text-lg font-bold">
                    Thread
                </p>
                <Button onClick={onClose} size="iconSm" variant="ghost">
                    <XIcon className="size-5 stroke-[1.5]" />
                </Button>
            </div>

            {/* It sets this div to bottom by using flex-col-reverse */}
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
                                hideThreadButton
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
            
                <Message
                    // for this panel the reply panle thread icon doesn't needed, so using hideThreadButton... 
                    hideThreadButton
                    memberId={message.memberId}
                    authorImage={message.user.image}
                    authorName={message.user.name}
                    // To enable the edit message feature if the message was written by the author...
                    isAuthor={message.memberId === currentMember?._id}
                    body={message.body}
                    image={message.image}
                    createdAt={message._creationTime}
                    updatedAt={message.updatedAt}
                    id={message._id}
                    reactions={message.reactions}
                    isEditing={editingId === message._id}
                    setEditingId={setEditingId} 
                />
            </div>

            <div className="px-4">
                <Editor
                    key={editorKey}
                    onSubmit={handleSubmit}
                    innerRef={editorRef}
                    disabled = {isPending}
                    placeholder="Reply.." 
                />
            </div>
        </div>
    )
}