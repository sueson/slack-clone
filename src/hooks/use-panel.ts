import { useParentMessageId } from "@/features/messages/store/use-parent-message-id";
import { useProfileMemberId } from "@/features/members/store/use-profile-member-id";

// Used for open by url...
export const usePanel = () => {
    const [parentMessageId, setParentMessageId] = useParentMessageId();
    const [profileMemberId, setProfileMemberId] = useProfileMemberId();

    // So it will open both id so setting parent id back to null, so it only open profile panel of member....
    const onOpenProfile = (memberId : string) => {
        setProfileMemberId(memberId);
        setParentMessageId(null);
    };

    // It will set the reply thread id to parent message id, so the new panel gets open...
    // Same as onOpenProfile, it opens both so making profile member back to null...
    const onOpenMessage = (messageId : string) => {
        setParentMessageId(messageId);
        setProfileMemberId(null);
    };

    // it removes the parentMessageId and profileMemberId, so the panel gets closed...
    const onClose = () => {
        setParentMessageId(null);
        setProfileMemberId(null);
    };

    return {
        parentMessageId,
        profileMemberId,
        onOpenProfile,
        onOpenMessage,
        onClose
    };
}