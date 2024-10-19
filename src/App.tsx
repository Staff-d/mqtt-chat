import "./App.css"
import { ChatPage } from "@/features/mqtt-chat/ChatPage"
import { useAppSelector } from "@/app/hooks"
import {
  mqttClientReady,
} from "@/features/mqtt-chat/mqttChatSlice"
import { ChatLogin } from "@/features/mqtt-chat/ChatLogin"

const App = () => {
  const connectionReady = useAppSelector(mqttClientReady)

  if (!connectionReady) {
    return <ChatLogin />
  }
  return <ChatPage />
}

export default App
