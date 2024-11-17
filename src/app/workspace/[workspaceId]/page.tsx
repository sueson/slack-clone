"use client"

import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { useCreateChannelModal } from "@/features/channels/store/use-create-channel-modal";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { Loader, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";



const WorkspaceIdPage = () => {
    const router = useRouter();

    const workspaceId = useWorkspaceId();

    const [open, setOpen] = useCreateChannelModal();

    const { data : member, isLoading : memberLoading } = useCurrentMember({ workspaceId });

    const { data : workspace, isLoading : workspaceLoading } = useGetWorkspace({ id : workspaceId });

    const { data : channels, isLoading : channelsLoading } = useGetChannels({
        workspaceId
    });

    const channelId = useMemo(() => channels?.[0]?._id, [channels]);
    const isAdmin = useMemo(() => member?.role === "admin", [member?.role]);

    useEffect(() => {
        if(workspaceLoading || channelsLoading || memberLoading || !member || !workspace) return;

        if(channelId) {
            router.push(`/workspace/${workspaceId}/channel/${channelId}`);
        } else if(!open && isAdmin) {
            // It will open the dialog box to add a new channel...
            // if every channel deleted it forcefully open dialog for create channel (only for admin member don't have the channel functionalities options like update and delete channel )...
            setOpen(true);
        }
    }, [
        member,
        memberLoading,
        isAdmin,
        channelId,
        workspaceLoading,
        channelsLoading,
        workspace,
        open,
        setOpen,
        router,
        workspaceId
    ]);

    if(workspaceLoading || channelsLoading || memberLoading) {
        return (
            <div className="h-full flex-1 flex items-center justify-center flex-col gap-2">
                <Loader className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if(!workspace || !member) {
        return (
            <div className="h-full flex-1 flex items-center justify-center flex-col gap-2">
                <TriangleAlert className="size-6 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                    Workspace not found
                </span>
            </div>
        )
    }


    return (
        <div className="h-full flex-1 flex items-center justify-center flex-col gap-2">
            <TriangleAlert className="size-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
                No channel found
            </span>
        </div>
    )
}

export default WorkspaceIdPage;