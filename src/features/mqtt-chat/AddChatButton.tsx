import type { FC } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { mqttUsername, newChat } from "@/features/mqtt-chat/mqttChatSlice"

export const AddChatButton: FC = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [chatName, setChatName] = useState("")

  const dispatch = useAppDispatch()
  const username = useAppSelector(mqttUsername)

  const handleAddChat = () => {
    setIsEditing(true)
  }

  const handleConfirm = () => {
    dispatch(newChat([chatName,username!]))
    setIsEditing(false)
    setChatName("")
  }

  if (isEditing) {
    return (
      <div className="flex w-full items-center space-x-2">
        <Input
          type="text"
          placeholder="Enter username"
          value={chatName}
          onChange={e => setChatName(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleConfirm} size="icon">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Confirm add chat</span>
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={handleAddChat} className="w-full" disabled={username === undefined}>
      Add chat
    </Button>
  )
}
