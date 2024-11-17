import { format, isToday, isYesterday } from "date-fns";
import { Doc, Id } from "../../convex/_generated/dataModel";
import dynamic from "next/dynamic";
import { Hint } from "./hint";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Thumbnail } from "./thumbnail";
import { Toolbar } from "./toolbar";
import { useUpdateMessage } from "@/features/messages/api/use-update-message";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRemoveMessage } from "@/features/messages/api/use-remove-message";
import { useConfirm } from "@/hooks/use-confirm";
import { useToggleReaction } from "@/features/reactions/api/use-toggle-reaction";
import { Reactions } from "./reactions";
import { usePanel } from "@/hooks/use-panel";
import { ThreadBar } from "./thread-bar";

// To dynamic import / render it...
const Renderer = dynamic(() => import ("@/components/renderer"), { ssr : false });
const Editor = dynamic(() => import ("@/components/editor"), { ssr : false });


interface MessageProps {
    id : Id<"messages">;
    memberId : Id<"members">;
    authorImage?: string;
    authorName?: string;
    isAuthor : boolean;
    // because we used some logics about reactions in message get method...
    reactions : Array<
        // Using Omit to remove the memberId just like did in the get method atlast the get method removes the memberId for to not show in frontend...
        Omit<Doc<"reactions">, "memberId"> & {
            // count and memberIds are in reactions in get method...
            count : number;
            memberIds : Id<"members">[]
        }>;
    body : Doc<"messages">["body"];
    image : string | null | undefined;
    createdAt : Doc<"messages">["_creationTime"];
    updatedAt : Doc<"messages">["updatedAt"];
    isEditing : boolean;
    isCompact?: boolean;
    setEditingId : (id: Id<"messages"> | null) => void;
    hideThreadButton?: boolean;
    threadCount?: number;
    threadImage?: string;
    threadName?: string;
    threadTimestamp?: number; 
}

const formatFullTime = (date : Date) => {
    // returns either today or yesterday or specific month, date, year and hour:min:sec:Am or Pm...
    return `${isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d, yyyy")} at ${format(date, "h:mm:ss a")}`;
}


export const Message = ({
    id,
    isAuthor,
    memberId,
    authorImage,
    authorName = "Member",
    reactions,
    body,
    image,
    createdAt,
    updatedAt,
    isEditing,
    isCompact,
    setEditingId,
    hideThreadButton,
    threadCount,
    threadImage,
    threadName,
    threadTimestamp
} : MessageProps) => {
    // To open a new panel by clicking the reply thread also open profile by clicking profile icon of member...
    const { parentMessageId, onOpenMessage, onOpenProfile, onClose } = usePanel();

    const [ConfirmDialog, confirm] = useConfirm(
        "Delete Message",
        "Are you sure you want to delete this message? This cannot be undone."
    );

    const { mutate : updateMessage, isPending : isUpdatingMessage } = useUpdateMessage();

    const { mutate : removeMessage, isPending : isRemovingMessage } = useRemoveMessage();

    const { mutate : toggleReaction, isPending : isTogglingReaction } = useToggleReaction();

    const isPending = isUpdatingMessage || isTogglingReaction;

    const handleReaction = (value : string) => {
        toggleReaction({ messageId : id, value }, {
            OnError : () => {
                toast.error("Failed to toggle reaction");
            }
        })
    }

    const handleRemove = async () => {
        const ok = await confirm();

        if(!ok) return;

        removeMessage({ id }, {
            onSuccess : () => {
                toast.success("Message deleted");

                // For closing the reply panel thread, if the reply message deleted, it change the new panel back to null...
                if(parentMessageId === id) {
                    onClose();
                }
            },
            OnError : () => {
                toast.error("Failed to delete message")
            }
        })
    }

    const handleUpdate = ({ body } : { body : string }) => {
        updateMessage({ id, body }, {
            onSuccess : () => {
                toast.success("Message updated");
                // Setting back to null makes to edit the message again...
                setEditingId(null);
            },
            OnError : () => {
                toast.error("Failed to update message");
            }
        })
    }

    // The compact used for if user sends messages within 5 minutes all the message send by a user will become a compact message rather than single messages...
    if(isCompact){
        return (
            <>
            <ConfirmDialog />
                <div className={cn(
                    "flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/50 group relative",
                    isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
                    isRemovingMessage && 
                    "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200"
                    )}>
                    <div className="flex items-start gap-2">
                        <Hint label={formatFullTime(new Date(createdAt))}>
                            <button className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 w-[40px] leading-[22px] text-center hover:underline">
                                {/* hour and minutes */}
                                {format(new Date(createdAt), "hh:mm")}
                            </button>
                        </Hint>
                        {isEditing ? (
                            <div className="w-full h-full">
                                <Editor
                                    onSubmit = {handleUpdate}
                                    disabled = {isPending}
                                    defaultValue = {JSON.parse(body)}
                                    onCancel = {() => setEditingId(null)}
                                    variant = "update" 
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col w-full">
                                {/* Renderer used to get the only text from json body */}
                                <Renderer value={body} />
                                <Thumbnail url={image} />
                                {updatedAt ? (
                                    <span className="text-xs text-muted-foreground">(edited)</span>
                                ) : null}
                                <Reactions data = {reactions} onChange = {handleReaction} />

                                {/* It's a thread bar, which shows the indicator for thread messages */}
                                <ThreadBar
                                    count={threadCount}
                                    image={threadImage}
                                    name={threadName}
                                    timestamp={threadTimestamp}
                                    onClick={() => onOpenMessage(id)}
                                />
                            </div>
                        )}
                        
                    </div>
                    {/* Crud for editing a message, with the toolbar */}
                    {!isEditing && (
                        <Toolbar
                            isAuthor = {isAuthor}
                            isPending = {isPending}
                            handleEdit = {() => setEditingId(id)}
                            // by handle thread it send reply message id to parent message id, which would open a new panel thread...
                            handleThread = {() => onOpenMessage(id)}
                            handleDelete = {handleRemove}
                            handleReaction = {handleReaction}
                            hideThreadButton = {hideThreadButton} 
                        />
                    )}
                </div>
            </>
        )
    }

    const avatarFallback = authorName.charAt(0).toUpperCase();

    return (
        <>
        <ConfirmDialog />
            <div className={cn(
                "flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/50 group relative",
                isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
                isRemovingMessage && 
                "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200"
                )}>
                <div className="flex items-start gap-2">
                    <button onClick={() => onOpenProfile(memberId)}>
                        <Avatar className="rounded-md">
                            <AvatarImage className="rounded-md" src={authorImage} />
                            <AvatarFallback className="rounded-md bg-red-500 text-white text-sm">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>
                    </button>
                    {isEditing ? (
                        <div className="w-full h-full">
                            <Editor
                                onSubmit = {handleUpdate}
                                disabled = {isPending}
                                defaultValue = {JSON.parse(body)}
                                onCancel = {() => setEditingId(null)}
                                variant = "update" 
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col w-full overflow-hidden">
                            <div className="text-sm">
                                <button onClick={() => onOpenProfile(memberId)} className="font-bold text-primary hover:underline">
                                    {authorName}
                                </button>
                                {/* It's a unicode for white spaces beside name text */}
                                <span>&nbsp;&nbsp;</span>
                                <Hint label={formatFullTime(new Date(createdAt))}>
                                    <button className="text-xs text-muted-foreground hover:underline">
                                        {format(new Date(createdAt), "hh:mm a")}
                                    </button>
                                </Hint>
                            </div>
                            {/* Renderer used to get the only text from json body */}
                            <Renderer value={body} />
                            <Thumbnail url={image} />
                            {/* For to show which text is edited */}
                            {updatedAt ? (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                            ) : null}
                            <Reactions data = {reactions} onChange = {handleReaction} />

                            {/* It's a thread bar, which shows the indicator for thread messages */}
                            <ThreadBar 
                                count={threadCount}
                                image={threadImage}
                                name={threadName}
                                timestamp={threadTimestamp}
                                onClick={() => onOpenMessage(id)}
                            />
                        </div>
                    )}
    
                </div>
                {/* Crud for editing a message, with the toolbar */}
                {/* toolbar only shows when it's not on edit */}
                {!isEditing && (
                    <Toolbar
                        isAuthor = {isAuthor}
                        isPending = {isPending}
                        handleEdit = {() => setEditingId(id)}
                        // by handle thread it send reply message id to parent message id, which would open a new panel thread...
                        handleThread = {() => onOpenMessage(id)}
                        handleDelete = {handleRemove}
                        handleReaction = {handleReaction}
                        hideThreadButton = {hideThreadButton} 
                    />
                )}
            </div>
        </>
    )
}