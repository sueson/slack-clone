import { Button } from "@/components/ui/button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { IconType } from "react-icons/lib";

// It is from the shadcn - for create variants like button components...
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";


// Used to add variants exactly like button components from shadcn...
const sidebarItemVariants = cva(
    "flex items-center gap-1.5 justify-start font-normal h-7 px-[18px] text-sm overflow-hidden",
    {
        variants : {
            variant : {
                default : "text-[#f9edffcc]",
                active : "text-[#481349] bg-white/90 hover:bg-white/90"
            }
        },
        defaultVariants : {
            variant : "default",
        }
    }
)

interface SidebarItemProps {
    label : string;
    id : string;
    icon : LucideIcon | IconType;
    // It is an optional property using ( ? ) which indicates this is not strict to follow...
    variant?: VariantProps<typeof sidebarItemVariants>["variant"];
}

export const SidebarItem = ({
    label,
    id,
    icon : Icon,  //naming it as Icon for to use as also a component...
    variant,
} : SidebarItemProps) => {
    const workspaceId = useWorkspaceId();

    return (
        // Using as child will make the link to be work as a anchor tag without any errors...
        <Button
        variant="transparent"
        size="sm" 
        className={cn(sidebarItemVariants({ variant }))}
        asChild>
            <Link href={`/workspace/${workspaceId}/channel/${id}`}>
                <Icon className="size-3.5 mr-1 shrink-0"/>
                <span className="text-sm truncate">{label}</span>
            </Link>
        </Button>
    )
}