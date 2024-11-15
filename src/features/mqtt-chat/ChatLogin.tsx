import type { FC, FormEvent } from "react"
import { useEffect } from "react"
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
import {
  connect,
  mqttClientState,
  mqttProtocolError,
} from "@/features/mqtt-chat/mqttChatSlice"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import type { MQTTCredentials } from "@/features/mqtt-chat/messageTypes"

export const ChatLogin: FC = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [useAuthentication, setUseAuthentication] = useState(true)
  const [useQos, setUseQos] = useState(true)
  const [useStatusMessages, setUseStatusMessages] = useState(true)
  const [deduplicateMessages, setDeduplicateMessages] = useState(false)

  const connectionState = useAppSelector(mqttClientState)
  const error = useAppSelector(mqttProtocolError)
  const isLoading =
    connectionState === "connecting" || connectionState === "disconnecting"
  const dispatch = useAppDispatch()

  useEffect(() => {
    const params = new URLSearchParams(document.location.search)
    if (params.size === 0) {
      return
    }
    const scenario = params.get("stage")
    if (scenario === null) {
      return
    }
    switch (scenario) {
      case "10":
        setUseQos(false)
        setUseStatusMessages(false)
        setUseAuthentication(false)
        break
      case "20":
        setUseQos(true)
        setUseStatusMessages(false)
        setUseAuthentication(false)
        break
      case "30":
        setUseQos(true)
        setUseStatusMessages(true)
        setUseAuthentication(false)
        break
      case "40":
        setUseQos(true)
        setUseStatusMessages(true)
        setUseAuthentication(true)
        break
    }
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    let credentials: MQTTCredentials = { username }
    if (useAuthentication) {
      credentials = { ...credentials, password }
    }

    dispatch(
      connect({
        brokerUrl: useAuthentication
          ? "ws://localhost:8080"
          : "ws://localhost:8081",
        credentials,
        useQos,
        useStatusMessages,
        deduplicateMessages,
      }),
    )
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
            {useAuthentication && (
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
            )}
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
          <Accordion
            type={"single"}
            collapsible={true}
            defaultValue={"options"}
          >
            <AccordionItem value={"options"} className="border-b-0">
              <AccordionTrigger>Options</AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useQos"
                      disabled={isLoading}
                      checked={useQos}
                      onCheckedChange={state => setUseQos(!!state)}
                    />
                    <Label htmlFor="useQos">Use QoS 1</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useStatusMessages"
                      disabled={isLoading}
                      checked={useStatusMessages}
                      onCheckedChange={state => setUseStatusMessages(!!state)}
                    />
                    <Label htmlFor="useStatusMessages">
                      Use status messages
                    </Label>
                  </div>
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
                      id="dedupMessages"
                      disabled={isLoading}
                      checked={deduplicateMessages}
                      onCheckedChange={state => setDeduplicateMessages(!!state)}
                    />
                    <Label htmlFor="dedupMessages">
                      Deduplicate messages client side
                    </Label>
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
