import { createAppSlice } from "../../app/createAppSlice"
import type { PayloadAction } from "@reduxjs/toolkit"
import { createAction, createSelector } from "@reduxjs/toolkit"
import type {
  ApplicationSettings,
  Message,
  WireMessage
} from "@/features/mqtt-chat/messageTypes"
import { wireMessageSchema } from "@/features/mqtt-chat/messageTypes"
import type { AppThunk } from "@/app/store"

export interface Chat {
  messages: Message[]
  participants: string[]
}

function chatIdFromMessage(participants: [string,string]) {
  const sortedParticipants = [...participants].sort()
  return `${sortedParticipants[0]}-${sortedParticipants[1]}`
}

export interface MqttChatSliceState {
  mqttClientState: "disconnected" | "connected" | "connecting"
  mqttError?: string
  chats: { [chartId: string]: Chat }
  settings?: ApplicationSettings
}

const initialState: MqttChatSliceState = {
  mqttClientState: "disconnected",
  chats: {
    'peter-sebastian': {
      participants: ['peter', 'sebastian'],
      messages: [
        {
          sender: "peter",
          receiver: "sebastian",
          timestamp: new Date().toISOString(),
          content: "Hello there!",
          messageId: "1",
        },
      ]
    },
  },
}

// If you are not using async thunks you can use the standalone `createSlice`.
export const mqttChatSlice = createAppSlice({
  name: "mqttChat",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: create => ({
    connect: create.reducer((state, action: PayloadAction<ApplicationSettings>) => {
      state.settings = action.payload
      state.mqttClientState = "connecting"
    }),
    connected: create.reducer(state => {
      state.mqttClientState = "connected"
    }),
    disconnected: create.reducer(state => {
      state.mqttClientState = "disconnected"
    }),
    protocolError: create.reducer((state, action: PayloadAction<string>) => {
      state.mqttError = action.payload
    }),
    clearProtocolError: create.reducer(state => {
      state.mqttError = undefined
    }),
    newChat: create.reducer((state, action: PayloadAction<[string,string]>) => {
      const chatId = chatIdFromMessage(action.payload)
      state.chats[chatId] = {
        participants: action.payload,
        messages: [],
      }
    }),
    chatMessageReceived: create.reducer(
      (state, action: PayloadAction<Message>) => {
        const chatId = chatIdFromMessage([action.payload.receiver, action.payload.sender])

        const existingChat = state.chats[chatId]
        if(existingChat === undefined) {
          state.chats[chatId] = {
            messages: [action.payload],
            participants: [action.payload.sender, action.payload.receiver],
          }
        } else if(!state.settings?.deduplicateMessages || existingChat.messages.find(message => message.messageId === action.payload.messageId) === undefined) {
          existingChat.messages.push(action.payload)
        } else {
          console.log(`Message ${action.payload.messageId} already received`)
        }
      },
    ),
    // chatMessageSent: create.reducer((state, action: PayloadAction<Message>) => {
    //   state.chats[action.payload.receiver] = [
    //     ...(state.chats[action.payload.receiver] || []),
    //     action.payload,
    //   ]
    // }),
  }),
  selectors: {
    mqttClientReady: mqttChat => mqttChat.mqttClientState === "connected",
    mqttClientState: mqttChat => mqttChat.mqttClientState,
    allChatMessages: mqttChat => mqttChat.chats,
    mqttCredentials: mqttChat => mqttChat.settings?.credentials,
    mqttProtocolError: mqttChat => mqttChat.mqttError,
  },
})

export const mqttUsername = createSelector(
  [mqttChatSlice.selectors.mqttCredentials],
  credentials => credentials?.username,
)
export const visibleChats = createSelector(
  [mqttChatSlice.selectors.allChatMessages],
  messages => Object.keys(messages),
)
export const chatMessages = createSelector(
  [mqttChatSlice.selectors.allChatMessages, (state, chatId) => chatId],
  (chatMessages, chatId) => chatMessages[chatId].messages || [],
)

export const chatParticipants = createSelector(
  [mqttChatSlice.selectors.allChatMessages, (state, chatId) => chatId],
  (chatMessages, chatId) => chatMessages[chatId].participants || [],
)

export const subscribeTopic = createAction<string>(
  `${mqttChatSlice.name}/subscribeTopic`,
)

export const messageReceived =
  (topic: string, payload: string): AppThunk =>
  (dispatch, getState) => {
    const topicMatch = Array.from(
      topic.matchAll(
        /^chat\/messages\/(?<receivingUser>.+)\/(?<sendingUser>.+)$/gm,
      ),
    )[0]
    if (topicMatch) {
      const { sendingUser, receivingUser } = topicMatch.groups!
      console.log(topic,sendingUser,receivingUser, topicMatch)
      const wireMessage = wireMessageSchema.parse(JSON.parse(payload))
      const message: Message = {
        sender: sendingUser,
        receiver: receivingUser,
        messageId: wireMessage.messageId,
        content: wireMessage.content,
        timestamp: wireMessage.timestamp,
      }
      dispatch(chatMessageReceived(message))
    }
  }

export const subscribeChatMessages = (): AppThunk => (dispatch, getState) => {
  const user = mqttUsername(getState())
  if (!user) {
    throw new Error("Not connected")
  }

  if(user === 'admin') {
    dispatch(subscribeTopic(`chat/messages/+/+`))
  } else {
    dispatch(subscribeTopic(`chat/messages/${user}/+`))
  }
}

export const mqttPublish = createAction<{ topic: string; payload: string }>(
  `${mqttChatSlice.name}/publish`,
)

export const sendMessage =
  (message: WireMessage, to: string): AppThunk =>
  (dispatch, getState) => {
    const user = mqttUsername(getState())
    if (!user) {
      throw new Error("Not connected")
    }
    wireMessageSchema.parse(message)

    const fullMessage: Message = { ...message, sender: user, receiver: to }
    dispatch(mqttChatSlice.actions.chatMessageReceived(fullMessage))
    // dispatch(mqttChatSlice.actions.chatMessageSent(fullMessage))

    dispatch(
      mqttPublish({
        topic: `chat/messages/${to}/${user}`,
        payload: JSON.stringify(message),
      }),
    )
  }

// Action creators are generated for each case reducer function.
export const {
  connect,
  connected,
  disconnected,
  chatMessageReceived,
  newChat,
  protocolError,
  clearProtocolError,
} = mqttChatSlice.actions

export const { mqttClientReady, mqttClientState, allChatMessages ,mqttProtocolError } = mqttChatSlice.selectors
