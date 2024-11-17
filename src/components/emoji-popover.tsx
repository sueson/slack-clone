import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";

// Tooltip for showing hint over hover something....
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";

// from bun add emoji-picker-react
import EmojiPcker, { type EmojiClickData } from "emoji-picker-react";

import { useState } from "react";



interface EmojiPopoverProps {
    children : React.ReactNode;
    hint? : string;
    onEmojiSelect : (value : string) => void;
}


export const EmojiPopover = ({
    children,
    hint = "Emoji",
    onEmojiSelect
} : EmojiPopoverProps) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [tooltipOpen, setTooltipOpen] = useState(false);

    // Don't have idea about emoji type, so strict type is not necessart so any is applied here...
    // EmojiClickData is a type for emoji imported from emoji-picker...
    const onSelect = (value : EmojiClickData) => {
        onEmojiSelect(value.emoji);
        setPopoverOpen(false);

        setTimeout(() => {
            setTooltipOpen(false);
        }, 500);
    }

    return (
        <TooltipProvider>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <Tooltip
                open={tooltipOpen}
                onOpenChange={setTooltipOpen}
                delayDuration={50}
                >
                    <PopoverTrigger asChild>
                        <TooltipTrigger asChild>
                            {children}
                        </TooltipTrigger>
                    </PopoverTrigger>
                        <TooltipContent className="bg-black text-white border border-white/5">
                            <p className="font-medium text-xs">
                                {hint}
                            </p>
                        </TooltipContent>
                </Tooltip>
                <PopoverContent className="p-0 w-full border-none shadow-none">
                    <EmojiPcker onEmojiClick={onSelect} />
                </PopoverContent>
            </Popover>
        </TooltipProvider>
    )
}