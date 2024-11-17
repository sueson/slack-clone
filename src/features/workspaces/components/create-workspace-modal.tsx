// "use client" (  No need of ue client in here because we imported this in modal.tsx and made that as use client, so it works as usual )


import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateWorkspaceModal } from "../store/use-create-workspace-modal";
import { useCreateWorkspace } from "../api/use-create-workspace";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";


export const CreateWorkspaceModal = () => {
    const router = useRouter();

    const [open, setOpen] = useCreateWorkspaceModal();
    const [name, setName] = useState("");

    const { mutate, isPending } = useCreateWorkspace()

    const handleClose = () => {
        setOpen(false);
        setName("");
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        mutate({name}, {
            onSuccess(id){
                toast.success("Workspace Created");
                router.push(`/workspace/${id}`);
                handleClose();
            }
        })
    }

    return(
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a Workspace</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending} 
                    required
                    autoFocus
                    minLength={3}
                    placeholder="Workspace name e.g. 'Work', 'Personal', 'Home'"
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