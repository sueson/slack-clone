"use client"


import { UserButton } from "@/features/auth/components/user-button";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter(); //Use to navigate like react by importing next/navigation...

  const [open, setOpen] = useCreateWorkspaceModal();

  const { data, isLoading } = useGetWorkspaces();
                                    
                                    //In here optional chaining is used which tells that if data exists provide if not make it undefined as well 0 has value provide it or make it undefined ( using it to avoid errors )...
  const workspaceId = useMemo(() => data?.[0]?._id, [data]);

  useEffect(() => {
    if(isLoading) return;

    if(workspaceId) {
      // replace used to replace the current url path...
      router.replace(`/workspace/${workspaceId}`)
    } else if(!open){
      setOpen(true)
    }
  },[isLoading, workspaceId, open, setOpen,router])

  return (
    <div>
      <UserButton/>
    </div>
  );
}
