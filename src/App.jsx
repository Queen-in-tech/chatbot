/* eslint-disable no-unused-vars */
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
} from "@chatscope/chat-ui-kit-react";
import { useEffect, useState } from "react";

function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hello, I am your AI chat assistant",
      sender: "assistant",
      direction: "incoming",
    },
  ]);

  const handleSend = async (message) => {
    const newMessage = {
      message: message,
      sender: "user",
      direction: "outgoing",
    };

    const newMessages = [...messages, newMessage];

    setMessages(newMessages);

    await processMessageToLlama();
  };
  const processMessageToLlama = async () => {
    const apiMessages = messages.map((messageObj) => {
      return { role: messageObj.sender, content: messageObj.message };
    });

    const url = "http://localhost:11434/api/chat";
    const headers = { "Content-Type": "application/json" };
    const data = {
      model: "gemma:2b",
      messages: [...apiMessages],
      stream: false,
    };
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });
    if (response.status == 200) {
      const respond = await response.json();
      const respondObj = {
        message: respond.message.content,
        sender: respond.message.role,
        direction: "incoming",
      };
      // const newMessages = [...messages, respondObj];
      setMessages((prevMessages) => [...prevMessages, respondObj]);
    } else {
      console.log("Error:", response.status, response.statusText);
    }
  };
  useEffect(() => {
    console.log(messages);
  }, [messages]);
  return (
    <div className="relative ">
      <div>
        <MainContainer>
          <ChatContainer>
            <MessageList>
              {messages.map((message, i) => (
                <Message key={i} model={message} />
              ))}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSend} />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export default App;
