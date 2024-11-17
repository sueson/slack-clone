// bun add nuqs...
import { useQueryState } from "nuqs";


// For open a member profile panel through url by clicking the member icon, by using nuqs feature...
export const useProfileMemberId = () => {
    return useQueryState("profileMemberId");
}