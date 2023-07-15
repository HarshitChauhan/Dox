import React, { useCallback, useEffect, useState } from "react";
import "quill/dist/quill.snow.css";
import Quill from "quill";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

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
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  //for making connection with server
  useEffect(() => {
    // const s = io("https://dox-server.herokuapp.com");
    // const s = io("http://localhost:3001",{transports: ['websocket'],upgrade:false});
    const s = io(process.env.REACT_APP_BACKEND_URL, {transports: ['websocket'],upgrade:false});
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  //for updating contents through recieved-changes event
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("recieve-changes", handler);

    return () => {
      socket.off("recieve-changes", handler);
    };
  }, [socket, quill]);

  //for persisting change on files with same users
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  // for bound data to user's document only
  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });
    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  //for saving content of file
  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null) return;
    const handleDisconnect = () => {
      console.log("Socket connection has been Disconnected! 💥");
    };
    const handleConnect = () => {
      console.log("Socket connection has been Created! 🎉");
    };
    const handleReconnect = () => {
      console.log("Socket connection has been Reconnected! 🎊");
    };
    socket.on("disconnect", handleDisconnect); 
    socket.on("connect", handleConnect); 
    socket.on("reconnect", handleReconnect); 
    return () => {
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleConnect);
      socket.off("reconnect", handleReconnect);
    };
  }, [socket]);

  

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      // theme: "bubble",
      modules: { toolbar: toolbarOptions },
    });


    //if document is loading...
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);

  return <div className="container" ref={wrapperRef}></div>;
}

export default TextEditor;
