import {
    Avatar,
    AvatarImage,
    AvatarFallback
} from "@/components/ui/avatar"


interface ConversationHeroProps {
    name?: string;
    image?: string;
}

// This is for a hero section for every conversations...
export const ConversationHero = ({ name = "Member", image } : ConversationHeroProps) => {
    const avatarFallback = name.charAt(0).toUpperCase();

    return (
        <div className="mt-[88px] mx-5 mb-4">
            <div className="flex items-center gap-x-1 mb-2">
                <Avatar className="size-14 rounded-md mr-2">
                    <AvatarImage className="rounded-md" src={image} />
                    <AvatarFallback className="rounded-md bg-red-500 text-white text-xs">
                        {avatarFallback}
                    </AvatarFallback>
                </Avatar>

                <p className="text-2xl font-bold">
                    {name}
                </p>
            </div>

            <p className="font-normal text-slate-800 mb-4">
                This conversation is between you and <strong>{name}</strong>
            </p>
        </div>
    )
}