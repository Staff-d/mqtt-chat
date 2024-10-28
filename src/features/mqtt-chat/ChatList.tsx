import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { FC } from "react"
import { useAppSelector } from "@/app/hooks"
import {
  allChatMessages,
  mqttUsername,
} from "@/features/mqtt-chat/mqttChatSlice"
import { AddChatButton } from "@/features/mqtt-chat/AddChatButton"

interface ComponentProps {
  activeChat: string
  setActiveChat: (chat: string) => void
}

export const ChatList: FC<ComponentProps> = ({ setActiveChat, activeChat }) => {
  const chats = Object.entries(useAppSelector(allChatMessages)).map(
    ([chatId, chat]) => ({ chatId, chat }),
  )
  const username = useAppSelector(mqttUsername)

  return (
    <Card className="h-full w-1/3 max-w-64">
      <CardHeader>
        <CardTitle>Chats</CardTitle>
        <AddChatButton />
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-full px-2">
          {chats.map(({ chatId, chat }) => (
            <div
              key={chatId}
              className={`flex items-center space-x-4 p-2 rounded-lg cursor-pointer ${
                activeChat === chatId ? "bg-muted" : "hover:bg-muted/50"
              }`}
              onClick={() => setActiveChat(chatId)}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {
                    chat.participants.filter(
                      participant => participant !== username,
                    )[0][0]
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {chat.participants
                    .filter(participant => participant !== username)
                    .join(",")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {`${chat.messages.at(-1)?.content?.slice(0, 20)}${
                    (chat.messages.at(-1)?.content?.length ?? 0) > 20 ? "…" : ""
                  }` ?? ""}
                </p>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
