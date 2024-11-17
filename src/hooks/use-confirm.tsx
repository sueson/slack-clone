import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogTitle
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { useState } from "react"


// For confirmation process...
export const useConfirm = (
    title : string,
    message : string
) : [() => JSX.Element, () => Promise<unknown>] => {
    const [promise, setPromise] = useState<{ resolve : (value : boolean) => void } | null>(null);

    const confirm = () => new Promise((resolve) => {
        setPromise({ resolve })
    });

    const handleClose = () => {
        setPromise(null);
    }

    const handleCancel = () => {
        promise?.resolve(false);
        handleClose();
    }

    const handleConfirm = () => {
        promise?.resolve(true);
        handleClose();
    }

    // Use paranthesis () instead of curly braces {} or will face with error ....
    // Clicking it open a new dialog box to ask confirm message or cancel...
    const ConfirmDialog = () => (
        <Dialog open = { promise !== null }>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="pt-2">
                    <Button
                    onClick={handleCancel}
                    variant="outline"
                    >
                        Cancel
                    </Button>

                    <Button
                    onClick={handleConfirm}
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

    // Returing both mothods...
    return [ConfirmDialog, confirm];
}