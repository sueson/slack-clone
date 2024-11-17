// installed with bun add quill....
import Quill, { type QuillOptions } from "quill";
import "quill/dist/quill.snow.css"

import { MutableRefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PiTextAa } from "react-icons/pi";
import { MdSend } from "react-icons/md";
import { Button } from "./ui/button";
import { ImageIcon, Smile, XIcon } from "lucide-react";
import { Hint } from "./hint";
import { Delta, Op } from "quill/core";
import { cn } from "@/lib/utils";
import { EmojiPopover } from "./emoji-popover";
import Image from "next/image";


type EditorValue = {
    image : File | null;
    body : string;
}

interface EditorProps {
    onSubmit : ({ image, body } : EditorValue) => void;
    onCancel?: () => void;
    placeholder?: string;
    // Op is an array...
    defaultValue?: Delta | Op[];
    disabled?: boolean;
    innerRef?: MutableRefObject<Quill | null>;
    variant?: "create" | "update";
}

// imprting editor from components for dynamic import, because the packages gonna use will not works with server side...
const Editor = ({ 
    onSubmit,
    onCancel,
    placeholder = "Write something...",
    defaultValue = [],
    disabled = false,
    innerRef,
    variant = "create" } : EditorProps) => {
    const [text, setText] = useState("");
    // It accepts the only type file or null...
    const [image, setImage] = useState<File | null>(null);
    const [isToolbarVisible, setIsToolbarVisible] = useState(true);

    // have to add the type HTMLDivElement...
    const containerRef = useRef<HTMLDivElement>(null);
    const submitRef = useRef(onSubmit);
    const plaaceholderRef = useRef(placeholder);
    const quillRef = useRef<Quill | null>(null);
    const defaultValueRef = useRef(defaultValue);
    const disabledRef = useRef(disabled);
    const imageElementRef = useRef<HTMLInputElement>(null);
    
    // used to update or get new values e.g. submitRef will get new value from onSubmit and don't need to put dependencies...
    useLayoutEffect(() => {
        submitRef.current = onSubmit;
        plaaceholderRef.current = placeholder;
        defaultValueRef.current = defaultValue;
        disabledRef.current = disabled;

    });


    useEffect(() => {
        if(!containerRef.current) return;

        const container = containerRef.current;
        const editorContainer = container.appendChild(
            container.ownerDocument.createElement("div"),
        );

        const options: QuillOptions = {
            // from quill css, which imported on top...
            theme : "snow",
            // by doing this way we don't need to add this in dependencies...
            placeholder : plaaceholderRef.current,

            // For changing keyboard key functions for enter to shift + enter to go for next line...
            modules : {
                // Can also modify what tools we needed...
                toolbar : [
                    ["bold", "italic", "strike"],
                    ["link"],
                    [{ list : "ordered" }, { list : "bullet" }]
                ],
                keyboard : {
                    bindings : {
                        enter : {
                            key : "Enter",
                            handler : () => {
                                const text = quill.getText();
                                const addedImage = imageElementRef.current?.files?.[0] || null;

                                const isEmpty = !addedImage && text.replace(/<{.|\n}*?>/g, "").trim().length === 0;

                                if(isEmpty) return;

                                const body = JSON.stringify(quill.getContents());
                                submitRef.current?.({ body, image: addedImage });
                            }
                        },
                        shift_enter : {
                            key : "Enter",
                            shiftKey : true,
                            handler : () => {
                                quill.insertText(quill.getSelection()?.index || 0, "\n"); 
                            }
                        }
                    }
                },
            }
        }

        const quill = new Quill(editorContainer, options);
        quillRef.current = quill;
        // using focus will automatically allow to type in editor message box once browser loads...
        quillRef.current.focus();

        // It enables the same above quill focus feature to innerRef, so can use it outside component...
        if(innerRef) {
            innerRef.current = quill;
        }

        quill.setContents(defaultValueRef.current);
        setText(quill.getText());

        // It's an event listener... 
        quill.on(Quill.events.TEXT_CHANGE, () => {
            setText(quill.getText())
        })

        // in react we have strict mode on and it called it twice so need to do a proper clean up...
        return () => {
            // It will turn off the listener...
            quill.off(Quill.events.TEXT_CHANGE);
            if(container) {
                container.innerHTML = "";
            }

            // if it exists it will clean up...
            if(quillRef.current) {
                quillRef.current = null;
            }

            if(innerRef) {
                innerRef.current = null;
            }
        }
        // don't add refs in dependency array and it don't cause re-renders when changes made...
        // cause if anything changes in parent components it will cause errors...
        // The reason of using useRef is useEffect used to render evertime when things changes so it cause problems that's why using useRef in this way...
    }, [innerRef]);

    const toogleToolbar = () => {
        setIsToolbarVisible((current) => !current);
        const toolbarElement = containerRef.current?.querySelector(".ql-toolbar");

        if(toolbarElement) {
            toolbarElement.classList.toggle("hidden");
        }
    }

    const onEmojiSelect = (emojiValue : string) => {
        const quill = quillRef.current;
        // quill?.: This is an optional chaining operator, which means the code will only run if quill is defined. If quill is null or undefined, the code won't throw an error and will stop executing...
        // quill.getSelection(): This gets the current selection or cursor position in the Quill editor. It returns an object with information about the current selection, including the index of where the cursor is located...
        // quill?.getSelection()?.index || 0: This retrieves the index (cursor position) where the emoji will be inserted. If getSelection() or index is null or undefined, it defaults to 0, meaning the emoji will be inserted at the beginning of the editor content if there is no selection...
        // quill.insertText(index, text): This method inserts the text (in this case, the emoji) at the specified index in the editor content...
        quill?.insertText(quill?.getSelection()?.index || 0, emojiValue);
    }

    // text from useState to check that it's empty...
    // even though it's empty quill used to store elements tags like <br/> or <p> , so using ( /<{.|\n}*?>/g, "" ) will make it empty and replace with empty string...
    const isEmpty = !image && text.replace(/<{.|\n}*?>/g, "").trim().length === 0;

    return (
        <div className="flex flex-col">
            <input
            type="file"
            accept="image/*"
            ref={imageElementRef}
            // To avoid typescript error using this symbol( ! )...
            onChange={(event) => setImage(event.target.files![0])}
            className="hidden" 
            />
            {/* When press send button it would disable the entire editor for a second by reducing the opacity */}
            <div className={cn(
                "flex flex-col border-slate-200 rounded-md overflow-hidden focus-within:border-slate-300 focus-within:shadow-sm transition bg-white",
                disabled && "opacity-50"

            )}>
                <div ref={containerRef} className="h-full ql-custom" />
                {!!image && (
                    <div className="p-2">
                        {/* The reason of using group/image because if we have multiple group class in this whole file it cause problems */}
                        <div className="relative size-[62px] flex items-center justify-center group/image">
                        {/* For removing image */}
                            <Hint label="Remove image">
                                <button
                                    onClick={() => {
                                        setImage(null);
                                        imageElementRef.current!.value = "";
                                    }}
                                    className="hidden group-hover/image:flex rounded-full bg-black/70 hover:bg-black absolute -top-2.5 -right-2.5 text-white size-6 z-[4] border-2 border-white items-center justify-center"
                                >
                                    <XIcon className="size-5" />
                                </button>
                            </Hint>

                            {/* For image uploading */}
                            <Image
                                src={URL.createObjectURL(image)}
                                alt="Uploaded"
                                fill
                                className="rounded-xl overflow-hidden border object-cover" 
                            />
                        </div>
                    </div>
                )}
                <div className="flex px-2 pb-2 z-[5]">
                    <Hint label={isToolbarVisible ? "Hide formatting" : "Show formatting"}>
                        <Button
                        disabled={disabled}
                        size="iconSm"
                        variant="ghost"
                        onClick={toogleToolbar}
                        >
                            <PiTextAa className="size-4"/>
                        </Button>
                    </Hint>

                    {/* From emoji-popover.tsx */}
                    {/* Clicking this emojiPopover button will add the selected emoji */}
                    <EmojiPopover onEmojiSelect={onEmojiSelect}>
                        <Button
                        disabled={disabled}
                        size="iconSm"
                        variant="ghost"
                        >
                            <Smile className="size-4"/>
                        </Button>
                    </EmojiPopover>

                    {/* It only visible if the editor used to create */}
                    {variant === "create" && (
                        <Hint label="Image">
                            <Button
                            disabled={disabled}
                            size="iconSm"
                            variant="ghost"
                            onClick={() => imageElementRef.current?.click()}
                            >
                                <ImageIcon className="size-4"/>
                            </Button>
                        </Hint>
                    )}

                    {variant === "update" && (
                        <div className="ml-auto flex items-center gap-x-2">
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={onCancel}
                            disabled={disabled}
                            >
                                Cancel
                            </Button>

                            <Button
                            disabled={disabled || isEmpty}
                            size="sm"
                            onClick={() => {
                                onSubmit({
                                    body : JSON.stringify(quillRef.current?.getContents()),
                                    image
                                })
                            }}
                            className="bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
                            >
                                Save
                            </Button>
                        </div>
                    )}

                    {variant === "create" && (
                        <Button
                        // disabled is updated from disabledRef.current...
                        disabled={disabled || isEmpty}
                        onClick={() => {
                            onSubmit({
                                body : JSON.stringify(quillRef.current?.getContents()),
                                image
                            })
                        }}
                        size="iconSm"
                        className={cn(
                            "ml-auto",
                            isEmpty
                            ? "bg-white hover:bg-white text-muted-foreground"
                            : 
                            "bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
                        )}
                        >
                            <MdSend className="size-4"/>
                        </Button>
                    )}
                </div>
            </div>
            {variant === "create" && (
                <div className={cn(
                    "p-2 text-[10px] text-muted-foreground flex justify-end opacity-0 transition",
                    !isEmpty && "opacity-100"
                    )}>
                    <p>
                        <strong>Shift + Return</strong> to add a new line
                    </p>
                </div>
            )}
            
        </div>
    )
}

export default Editor;