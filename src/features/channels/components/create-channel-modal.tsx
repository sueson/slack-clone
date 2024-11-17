import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { useCreateChannelModal } from "../store/use-create-channel-modal"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCreateChannel } from "../api/use-create-channel";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useRouter } from "next/navigation";
import { toast } from "sonner";


export const CreateChannelModal = () => {
    const router = useRouter();

    const workspaceId = useWorkspaceId();

    const { mutate, isPending } = useCreateChannel();
    // From channel store...
    const [open, setOpen] = useCreateChannelModal();

    const [name, setName] = useState("");

    const handleChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        // For incase a user name a channel without adding ( - ) inbetween channel names it used to add ( - ) if we press space button inbetween names...
        const value = e.target.value.replace(/\s+/g, "-").toLowerCase();
        setName(value);
    }

    const handleClose = () => {
        setName("");
        setOpen(false);
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        mutate(
            { name, workspaceId },
            {
                onSuccess : (id) => {
                    toast.success("Channel Created")
                    // Redirect to new channel... 
                    router.push(`/workspace/${workspaceId}/channel/${id}`);
                    handleClose();
                },
                OnError : () => {
                    toast.error("Failed to create channel")
                }
            }
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Add a Channel
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                    value={name}
                    disabled={isPending}
                    onChange={handleChange}
                    required
                    autoFocus
                    minLength={3}
                    maxLength={80}
                    placeholder="e.g. plan-budget" 
                    />
                    <div className="flex justify-end">
                        <Button disabled={isPending}>
                            Create
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}