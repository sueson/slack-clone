import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCallback, useMemo, useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";


// request type accepts id and name which is done in convex / workspaces.ts...
type RequestType = { id : Id<"workspaces">, name : string};
type ResponseType = Id<"workspaces"> | null;

type Options = {
    // Creating optional callback functions ( eg. onSuccess is succeeds the operational will excecute )
    onSuccess?: (data : ResponseType) => void;
    OnError?: (error : Error) => void;
    onSettled?: () => void;
    throwError?: boolean;
}

export const useUpdateWorkspace = () => {
    const [data, setData] = useState<ResponseType>(null);
    const [error, setError] = useState<Error | null>(null);
    const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null);

    const isPending = useMemo(() => status === "pending", [status]);
    const isSuccess = useMemo(() => status === "success", [status]);
    const isError = useMemo(() => status === "error", [status]);
    const isSettled = useMemo(() => status === "settled", [status]);


    const mutation = useMutation(api.workspaces.update);

    const mutate = useCallback(async (values : RequestType, options?: Options) => {
        try {
            setData(null);
            setError(null);
            setStatus("pending");

            const response = await mutation(values);
            options?.onSuccess?.(response)
            return response;
        }
        catch(error) {
            setStatus("error");
            options?.OnError?.(error as Error)

            if(options?.throwError) {
                throw error
            }
        }
         finally {
            setStatus("settled")

            options?.onSettled?.()
         }
    }, [mutation])

    return {
        mutate,
        data,
        error,
        isPending,
        isSuccess,
        isError,
        isSettled
    }
}