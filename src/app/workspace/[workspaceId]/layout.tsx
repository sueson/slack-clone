"use client"


import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "@/components/ui/resizable";

import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { usePanel } from "@/hooks/use-panel";
import { Loader } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { Thread } from "@/features/messages/components/thread";
import { Profile } from "@/features/members/components/profile";

interface WorkspaceIdLayoutProps {
    children : React.ReactNode;
}

const WorkspaceIdLayout = ( {children} : WorkspaceIdLayoutProps) => {
    // For creating a new panel if it has parent message id...
    // and for to open a profile of member... 
    const { parentMessageId, profileMemberId, onClose } = usePanel();

    const showPanel = !!parentMessageId || !!profileMemberId;

    return(
        <div className="h-full">
            <Toolbar/>
            <div className="flex h-[calc(100vh-40px)]">
                <Sidebar/>
                <ResizablePanelGroup 
                direction="horizontal"
                // Using autosave id will save the size we made still the browser refreshes...
                autoSaveId="ca-workspace-layout"
                >
                    {/* Resizable panel used to create a panel */}
                    <ResizablePanel
                    defaultSize={20}
                    minSize={11}
                    className="bg-[#5E2C5F]"
                    >
                        <WorkspaceSidebar/>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel minSize={20} defaultSize={80}>
                        {children}
                    </ResizablePanel>

                    {showPanel && (
                        <>
                            <ResizableHandle withHandle />
                            {/* create a new panel when got parent message id */}
                            <ResizablePanel minSize={20} defaultSize={29}>
                                {/* By clicking the reply thread, if have parentMessageId, it would open it, if not the loader animation runs */}
                                {parentMessageId ? (
                                    <Thread
                                        // The reason of using parentMessageId as messages, because the getById from message.ts only accepts messages...
                                        messageId = {parentMessageId as Id<"messages">}
                                        onClose = {onClose} 
                                    />
                                    // IF it has profile member id, it opens a profile of member...
                                ) : profileMemberId ? (
                                    <Profile
                                        // The same as above there is no id created for profilemember id as using the members as Id...
                                        memberId = {profileMemberId as Id<"members">}
                                        onClose = {onClose}
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader className="size-5 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </ResizablePanel>
                        </>
                    )}
                    
                </ResizablePanelGroup>
                
            </div>
        </div>
    )
}

export default WorkspaceIdLayout;