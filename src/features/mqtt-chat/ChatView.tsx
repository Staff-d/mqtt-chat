import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { SendHorizontal } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { FC } from "react"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import {
  chatMessages,
  chatParticipants,
  mqttUsername,
  sendChatMessage,
} from "@/features/mqtt-chat/mqttChatSlice"
import { DateTime } from "luxon"
import { ChatUserStateBadge } from "@/features/mqtt-chat/ChatUserStateBadge"

interface ComponentsProps {
  activeChat: string
}

export const ChatView: FC<ComponentsProps> = ({ activeChat }) => {
  const [newMessage, setNewMessage] = useState("")
  const dispatch = useAppDispatch()
  const messages = useAppSelector(state => chatMessages(state, activeChat))
  const participants = useAppSelector(state =>
    chatParticipants(state, activeChat),
  )
  const user = useAppSelector(mqttUsername)

  // the name of the chat partner. If this is not defined, the user is not
  // a participant of this conversation
  const chatPartner: string | undefined = participants.includes(user!)
    ? participants.filter(participant => participant !== user)[0]
    : undefined
  const inputDisabled = chatPartner === undefined

  const handleSendMessage = () => {
    const trimmedMessage = newMessage.trim()
    if (trimmedMessage.length === 0) {
      return
    }

    if (chatPartner === undefined) {
      return
    }

    const now = new Date()
    dispatch(
      sendChatMessage(
        {
          content: trimmedMessage,
          timestamp: now.toISOString(),
          messageId: uuidv4(),
        },
        chatPartner,
      ),
    )
    setNewMessage("")
  }

  const titleContent =
    chatPartner === undefined ? (
      <>
        Conversation between{" "}
        {participants.map((participant, index) => (
          <>
            <span>{participant}</span>
            (<ChatUserStateBadge username={participant} />)
            {index < participants.length - 1 && <span>and</span>}
          </>
        ))}
      </>
    ) : (
      <>
        Conversation with {chatPartner}
        <ChatUserStateBadge username={chatPartner} />
      </>
    )

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex flex-row align-baseline gap-2">
          {titleContent}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-15rem)] pr-4">
          {messages.map(message => (
            <div
              key={message.messageId}
              className={`flex ${message.sender === user ? "justify-end" : "justify-start"} mb-4`}
            >
              <div
                className={`flex flex-col ${message.sender === user ? "items-end" : "items-start"}`}
              >
                <div
                  className={`flex ${message.sender === user ? "flex-row-reverse" : "flex-row"} items-baseline `}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{message.sender[0]}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`mx-2 p-3 rounded-lg bg-primary text-primary-foreground`}
                  >
                    {message.content}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground mx-2 mt-1">
                  {DateTime.fromISO(message.timestamp).toLocaleString(
                    DateTime.TIME_SIMPLE,
                  )}
                </span>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex w-full items-center space-x-2"
        >
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            disabled={inputDisabled}
          />
          <Button type="submit" size="icon" disabled={inputDisabled}>
            <SendHorizontal className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
