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
  chatMessages, chatParticipants,
  mqttUsername,
  sendMessage
} from "@/features/mqtt-chat/mqttChatSlice"

interface ComponentsProps {
  activeChat: string
}

export const ChatView: FC<ComponentsProps> = ({ activeChat }) => {
  const [newMessage, setNewMessage] = useState("")
  const messages = useAppSelector(state => chatMessages(state, activeChat))
  const participants = useAppSelector(state => chatParticipants(state, activeChat))
  const username = useAppSelector(mqttUsername)

  const inputDisabled = username === undefined || !participants.includes(username)

  const dispatch = useAppDispatch()
  const user = useAppSelector(mqttUsername)

  const handleSendMessage = () => {
    const trimmedMessage = newMessage.trim()
    if (trimmedMessage.length === 0) {
      return
    }

    const now = new Date()
    dispatch(
      sendMessage(
        {
          content: trimmedMessage,
          timestamp: now.toISOString(),
          messageId: uuidv4(),
        },
        participants.filter(participant => participant !== username)[0],
      ),
    )
    setNewMessage("")
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Chat Support</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-15rem)] pr-4">
          {messages.map(message => (
            <div
              key={message.messageId}
              className={`flex ${message.sender === user ? "justify-end" : "justify-start"} mb-4`}
            >
              <div
                className={`flex ${message.sender === user ? "flex-row-reverse" : "flex-row"} items-start`}
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
