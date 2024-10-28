import type { FC } from "react"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/app/hooks"
import { chatUserState } from "@/features/mqtt-chat/mqttChatSlice"

interface ComponentProps {
  username: string
}

export const ChatUserStateBadge: FC<ComponentProps> = ({ username }) => {
  const participantUserState = useAppSelector(state =>
    chatUserState(state, username),
  )

  if (participantUserState?.status === "online") {
    return (
      <Badge variant={"default"} className={"bg-green-600 hover:bg-green-600"}>
        Online
      </Badge>
    )
  } else if (participantUserState?.status === "offline") {
    return (
      <Badge variant={"default"} className={"bg-red-500 hover:bg-red-500"}>
        Offline
      </Badge>
    )
  } else {
    return (
      <Badge variant={"default"} className={"bg-gray-500 hover:bg-gray-500"}>
        Unknown
      </Badge>
    )
  }
}
