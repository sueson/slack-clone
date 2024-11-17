import Quill from "quill";
import { useEffect, useRef, useState } from "react";


interface RendererProps {
    value : string;
}


// For loading dynamically, so using export default...
// Using this for get only text from json body...
const Renderer = ({ value } : RendererProps) => {
    const [isEmpty, setIsEmpty] = useState(false);
    const rendererRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(!rendererRef.current) return;

        const container = rendererRef.current;

        const quill = new Quill(document.createElement('div'), {
            theme : "snow",
        });

        // We are not building a editor just trying to render the text so make the quill to not enable...
        // So it only makes readOnly mode..
        quill.enable(false);

        const contents = JSON.parse(value);
        quill.setContents(contents);

        const isEmpty = quill.getText().replace(/<{.|\n}*?>/g, "").trim().length === 0;
        setIsEmpty(isEmpty);

        container.innerHTML = quill.root.innerHTML;

        // Finally to unmount ( clean this )...
        return () => {
            if(container) {
                container.innerHTML = "";
            }
        }
    },[value]);

    if(isEmpty) return null;

    return <div ref={rendererRef} className="ql-editor ql-renderer" />
}

export default Renderer;