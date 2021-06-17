import React, { useCallback, useEffect, useState } from "react";
import "quill/dist/quill.snow.css";
import Quill from "quill";
import { io } from "socket.io-client";

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block", "image"],

  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  [{ direction: "rtl" }], // text direction

  [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],

  ["clean"], // remove formatting button
];

function TextEditor() {

  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  //for making connection with server
  useEffect(()=>{
    const s=io("http://localhost:3001");
    setSocket(s);
    return()=>{
      s.disconnect();
    }
  },[]);

  //for persisting change on files with same users
  useEffect(()=>{
    if(socket==null || quill ==null) return;

    const handler = (delta, oldDelta, source) => {
      if(source!=='user') return;
      socket.emit('send-changes',delta);
    };
    quill.on('text-change', handler);

    return ()=>{
      quill.off('text-change',handler);
    }
  },[socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q=new Quill(editor, { theme: "snow", modules: { toolbar: toolbarOptions } });
    setQuill(q);
  }, []);

  return <div className="container" ref={wrapperRef}></div>;
}

export default TextEditor;
