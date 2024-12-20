import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { Loader, Plus } from "lucide-react";
import { useRouter } from "next/navigation";



export const WorkspaceSwitcher = () => {
    const router = useRouter();

    const workspaceId = useWorkspaceId();

    // By giving underscore says that it already in use without even using it in here (if doesn't it appears error of not uisng the open)...
    const [, setOpen] = useCreateWorkspaceModal();
    // console.log("_open: ", _open);

    //To access the particular workspace...
    const {data : workspace, isLoading : workspaceLoading} = useGetWorkspace({id : workspaceId});

    //To access all the workspaces...
    const {data : workspaces} = useGetWorkspaces();

    // Filtering the workspaces which are not already in use...
    const filteredWorkspaces = workspaces?.filter(
        (workspace) => workspace?._id !== workspaceId
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="size-9 relative overflow-hidden bg-[#ABABAD] hover:bg-[#ABABAD]/80 text-slate-800 font-semibold text-xl">
                    {
                    workspaceLoading ? (
                        <Loader className="size-5 animate-spin shrink-0"/>
                    ) : 
                    (
                        workspace?.name.charAt(0).toUpperCase()
                    )
                    }
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className="w-64">
                <DropdownMenuItem 
                onClick={() => router.push(`/workspace/${workspaceId}`)}
                className="cursor-pointer flex-col justify-start items-start capitalize">
                    {workspace?.name}
                    <span className="text-xs text-muted-foreground">
                        Active Workspace
                    </span>
                </DropdownMenuItem>
                {
                    filteredWorkspaces?.map((workspace) => (
                        <DropdownMenuItem
                        key={workspace._id}
                        className="cursor-pointer capitalize overflow-hidden"
                        // By clicking this will change the workspace by route path...
                        onClick={() => router.push(`/workspace/${workspace._id}`)} 
                        >
                            <div className="shrink-0 size-9 relative overflow-hidden bg-[#616061] text-white font-semibold text-lg rounded-md flex items-center justify-center mr-2">
                                {workspace.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="truncate">
                                {workspace.name}
                            </p>
                        </DropdownMenuItem>
                    ))
                }

                {/* It will open the workspace by useCreateWorkspaceModal */}
                <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setOpen(true)}
                >
                    <div className="size-9 relative overflow-hidden bg-[#F2F2F2] text-slate-800 font-semibold text-lg rounded-md flex items-center justify-center mr-2">
                        <Plus/>
                    </div>
                    Create a new Workspace
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}