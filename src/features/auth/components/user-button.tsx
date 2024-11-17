"use client"

import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "../api/use-current-user";
import { Loader, LogOut } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export const UserButton = () => {
    const router = useRouter();

    const {signOut} = useAuthActions();

    const {data, isLoading} = useCurrentUser();

    //  Show loader while data is loading...
    if(isLoading) {
        return <Loader className="size-4 animate-spin text-muted-foreground" />
    }

    // If there's no user data, return null...
    if(!data) {
        return null;
    }

    const { image, name } = data;

    // Tells that user gonna have a name for sure ( with using ! ) if the user don't have a image it will take the first letter of the user and make it as profile image exactly like google...
    // The name! is used to override TypeScript's safety checks and assert that name is guaranteed to have a valid value (i.e., it won't be null or undefined).
    const avatarFallback = name!.charAt(0).toUpperCase();

    const handleLogout = async () => {
        await signOut();
        router.push("/");

        window.location.reload();
    }

    return (
        // Making the modal as false allows to interact with other components while the dropdown menu opens...
        <DropdownMenu modal={false}>

            <DropdownMenuTrigger className="outline-none relative">

                <Avatar className="rounded-md size-10 hover:opacity-75 transition">

                    <AvatarImage className="rounded-md" alt={name} src={image}/>

                    <AvatarFallback className="rounded-md bg-red-500 text-white">
                        {avatarFallback}
                    </AvatarFallback>

                </Avatar>

            </DropdownMenuTrigger>

            <DropdownMenuContent align="center" side="right" className="w-60">

                <DropdownMenuItem onClick={handleLogout} className="h-10">
                    <LogOut className="size-4 mr-2"/>
                    Log out
                </DropdownMenuItem>

            </DropdownMenuContent>

        </DropdownMenu>
    )
}