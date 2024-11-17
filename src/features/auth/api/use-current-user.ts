import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"

export const useCurrentUser = () => {
    // retrives data from current which from /api/users.ts
    const data = useQuery(api.users.current);

    // This line checks whether data is still undefined, which would mean the data has not yet been fetched or is still in the process of loading.
    // If data is undefined, then isLoading will be set to true, indicating that the data is currently loading.
    // Once the data is fully fetched, data will no longer be undefined, and isLoading will be false.
    const isLoading = data === undefined;

    return {data, isLoading};
}