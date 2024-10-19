import { useEffect, useState } from "react"
import { ChatList } from "@/features/mqtt-chat/ChatList"
import { ChatView } from "@/features/mqtt-chat/ChatView"
import {
  mqttUsername,
  subscribeChatMessages,
} from "@/features/mqtt-chat/mqttChatSlice"
import { useAppDispatch, useAppSelector } from "@/app/hooks"

export const ChatPage = () => {
  const [activeChat, setActiveChat] = useState("")
  const username = useAppSelector(mqttUsername)

  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!username) {
      return
    }

    dispatch(subscribeChatMessages())
  }, [dispatch, username])

  return (
    <div className="flex h-screen w-full space-x-4 p-4">
      <div className="w-1/3">
        <ChatList activeChat={activeChat} setActiveChat={setActiveChat} />
      </div>
      <div className="w-2/3">
        {activeChat && <ChatView activeChat={activeChat} />}
      </div>
    </div>
  )
}
