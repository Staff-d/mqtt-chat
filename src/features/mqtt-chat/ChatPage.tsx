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
import { Toggle } from "@/components/ui/toggle"
import { PacketTable } from "@/features/mqtt-chat/PacketTable"

export const ChatPage = () => {
  const [activeChat, setActiveChat] = useState("")
  const username = useAppSelector(mqttUsername)
  const [showPackets, setShowPackets] = useState(false)

  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!username) {
      return
    }

    dispatch(subscribeChatMessages())
  }, [dispatch, username])

  return (
    <div className="flex flex-col h-dvh w-full">
      <div className="flex flex-row w-full h-1/12 items-baseline justify-between px-4 py-2">
        <span className="text-2xl font-bold tracking-wide">MQTT Chat</span>
        <div className="flex flex-row gap-2">
          <Toggle
            variant={"outline"}
            pressed={showPackets}
            onPressedChange={() => setShowPackets(prev => !prev)}
          >
            Show Packets
          </Toggle>
          <Button variant={"outline"} onClick={() => dispatch(disconnect())}>
            Logout
          </Button>
        </div>
      </div>

      <div className="flex flex-row grow space-x-4 px-4 w-full h-11/12 pb-2">
        {!showPackets && (
          <>
            <ChatList activeChat={activeChat} setActiveChat={setActiveChat} />
            <div className="grow">
              {activeChat && <ChatView activeChat={activeChat} />}
            </div>
          </>
        )}
        {showPackets && <PacketTable />}
      </div>
    </div>
  )
}
