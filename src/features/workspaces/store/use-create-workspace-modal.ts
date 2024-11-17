// While using jotai and other state management try to use ( use client wherever using this )
import {atom, useAtom} from "jotai";

const modalState = atom(false);

// - atom is like state in redux
// - setting modalState = atom(false) ⇒ is like setting initial value : false in redux
export const useCreateWorkspaceModal = () => {
    return useAtom(modalState);
}