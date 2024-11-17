import { useParams } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";


//Creating the workspace id to used in other components to access the workspace id...
export const useWorkspaceId = () => {
    const params = useParams();

    return params.workspaceId as Id<"workspaces">
}