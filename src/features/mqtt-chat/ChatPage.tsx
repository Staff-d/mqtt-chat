import { useEffect, useState } from "react"
import { ChatList } from "@/features/mqtt-chat/ChatList"
import { ChatView } from "@/features/mqtt-chat/ChatView"
import {
  disconnect,
  mqttUsername,
  subscribeChatMessages,
} from "@/features/mqtt-chat/mqttChatSlice"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { Button } from "@/components/ui/button"

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
    <div className="flex flex-col  h-screen w-full  ">
      <div className="flex flex-row w-full items-baseline justify-between px-4 py-2">
        <span className="text-2xl font-bold tracking-wide">MQTT Chat</span>
        <Button variant={"outline"} onClick={() => dispatch(disconnect())}>
          Logout
        </Button>
      </div>
      <div className="flex flex-row space-x-4 px-4 w-full h-full">
        <div className="w-1/3">
          <ChatList activeChat={activeChat} setActiveChat={setActiveChat} />
        </div>
        <div className="w-2/3">
          {activeChat && <ChatView activeChat={activeChat} />}
        </div>
      </div>
    </div>
  )
}
