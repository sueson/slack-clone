// imprting editor from components for dynamic import, because the packages named quill will not works with server side...
import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload";
import { useChannelId } from "@/hooks/use-channel-id";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import dynamic from "next/dynamic"
import Quill from "quill";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Id } from "../../../../../../convex/_generated/dataModel";
// importing this way will prevent hard refresh and avoid server errors...
const Editor = dynamic(() => import ("@/components/editor"), {ssr : false});


interface ChatInputProps {
    placeholder : string;
}

type CreateMessageValues = {
    channelId : Id<"channels">;
    workspaceId : Id<"workspaces">;
    body : string;
    image : Id<"_storage"> | undefined;
}

export const ChatInput = ({ placeholder } : ChatInputProps) => {
    const [editorKey, setEditorKey] = useState(0);
    const [isPending, setIsPending] = useState(false);

    const editorRef = useRef<Quill | null>(null);

    const workspaceId = useWorkspaceId();
    const channelId = useChannelId();

    const { mutate : generateUploadUrl } = useGenerateUploadUrl();

    const { mutate : createMessage } = useCreateMessage();

    // Can also do onSubmit and onError and mutate method like other but with this method it would be easy as simple...
    const handleSubmit = async ({
        body,
        image
    } : {
        body : string;
        image : File | null;
    }) => {
        try {
            setIsPending(true);
            editorRef?.current?.enable(false);

            // By giving ( : ) checks the type of CreateMessageValues, which is mentioned on top in type...
            const values : CreateMessageValues = {
                channelId,
                workspaceId,
                body,
                image : undefined
            };

            // If user submit the image...
            // Also to handle the upload image processes..
            if(image) {
                // If no url it also throw error by made it as true...
                const url = await generateUploadUrl({}, { throwError : true });

                if(!url) {
                    throw new Error("Url not found");
                }

                const result = await fetch(url, {
                    method : "POST",
                    headers : { "Content-Type" : image.type },
                    body : image
                })

                if(!result.ok) {
                    throw new Error("Failed to upload image");
                }

                // extracting storageId from json...
                const { storageId } = await result.json();

                values.image = storageId;
            }

            await createMessage(values, { throwError : true });
    
            // Every time the key changes the editor component erase the text inside once send button pressed...
            setEditorKey((prevKey) => prevKey + 1);
        }
        catch (error) {
            toast.error("Failed to send message");
            console.log("Failed to send message", error);
        }
        finally {
            setIsPending(false);
            editorRef?.current?.enable(true);
        }
        
    }

    return (
        <div className="px-5 w-full">
            <Editor 
            // Every time the key changes the editor component erase the text inside once send button pressed...
            key={editorKey}
            // To get dynamic channel name modified in page.tsx...
            placeholder={placeholder}
            onSubmit={handleSubmit}
            disabled={isPending}
            // By using innerRef in this way we can use it outside this component by adding editorRef in it e.g. like quill focus feature...
            innerRef={editorRef} 
            />
        </div>
    )
}