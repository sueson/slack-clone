// bun add nuqs...
import { useQueryState } from "nuqs";


// For open a new panel by clicking the reply thread icon, by using nuqs feature...
export const useParentMessageId = () => {
    return useQueryState("parentMessageId");
}