import { useParams } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";


//Creating the channel id to used in other components to access the channel id...
export const useChannelId = () => {
    const params = useParams();

    return params.channelId as Id<"channels">
}