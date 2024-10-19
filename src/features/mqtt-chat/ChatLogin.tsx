import type { FC } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { AlertCircle, Loader2 } from "lucide-react"
import { connect, mqttClientState, mqttProtocolError } from "@/features/mqtt-chat/mqttChatSlice"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import type { MQTTCredentials } from "@/features/mqtt-chat/messageTypes"

export const ChatLogin: FC = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [useAuthentication, setUseAuthentication] = useState(false)
  const [subscribeQos2, setsubscribeQos2] = useState(false)
  const [deduplicateMessages, setDeduplicateMessages] = useState(false)

  const connectionState = useAppSelector(mqttClientState)
  const error = useAppSelector(mqttProtocolError)
  const isLoading = connectionState === "connecting"
  const dispatch = useAppDispatch()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let credentials: MQTTCredentials = { username }
    if (useAuthentication) {
      credentials = { ...credentials, password }
    }

    dispatch(connect({
      credentials,
      subscribeQos2,
      deduplicateMessages
    }))
  }

  return (
    <div className="flex h-screen">
      <Card className="w-full max-w-md my-auto mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the MQTT Chat!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="username"
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            {useAuthentication &&
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  placeholder={"*****"}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            }
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
          <Accordion type={"single"} collapsible={true}>
            <AccordionItem value={"options"}>
              <AccordionTrigger>Options</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useAuth"
                      disabled={isLoading}
                      checked={useAuthentication}
                      onCheckedChange={state => setUseAuthentication(!!state)}
                    />
                    <Label htmlFor="useAuth">Use Authentication</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="subQOS2"
                      disabled={isLoading}
                      checked={subscribeQos2}
                      onCheckedChange={state => setsubscribeQos2(!!state)}
                    />
                    <Label htmlFor="subQOS2">Subscribe QOS2</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dedupMessages"
                      disabled={isLoading}
                      checked={deduplicateMessages}
                      onCheckedChange={state => setDeduplicateMessages(!!state)}
                    />
                    <Label htmlFor="dedupMessages">Dedup Messages</Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
