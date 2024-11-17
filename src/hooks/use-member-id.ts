import { useParams } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";


//Creating the member id to used in other components to access the member id...
export const useMemberId = () => {
    const params = useParams();

    return params.memberId as Id<"members">
}