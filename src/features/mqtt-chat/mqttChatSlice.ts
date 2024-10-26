import { createAppSlice } from "../../app/createAppSlice"
import type { PayloadAction } from "@reduxjs/toolkit"
import { createAction, createSelector } from "@reduxjs/toolkit"
import type {
  ApplicationSettings,
  Message,
  StatusMessage,
  WireMessage,
  WireStatusMessage,
} from "@/features/mqtt-chat/messageTypes"
import { wireStatusMessageSchema } from "@/features/mqtt-chat/messageTypes"
import { wireMessageSchema } from "@/features/mqtt-chat/messageTypes"
import type { AppThunk } from "@/app/store"

export interface Chat {
  messages: Message[]
  participants: string[]
}

function chatIdFromMessage(participants: [string, string]) {
  const sortedParticipants = [...participants].sort()
  return `${sortedParticipants[0]}-${sortedParticipants[1]}`
}

export interface MqttChatSliceState {
  mqttClientState: "disconnected" | "connected" | "connecting" | "disconnecting"
  mqttError?: string
  chats: { [chartId: string]: Chat }
  chatUserStates: { [userId: string]: WireStatusMessage }
  settings?: ApplicationSettings
}

const initialState: MqttChatSliceState = {
  mqttClientState: "disconnected",
  chatUserStates: {},
  chats: {
    "peter-sebastian": {
      participants: ["peter", "sebastian"],
      messages: [
        {
          sender: "peter",
          receiver: "sebastian",
          timestamp: new Date().toISOString(),
          content: "Hello there!",
          messageId: "1",
        },
      ],
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
    connect: create.reducer(
      (state, action: PayloadAction<ApplicationSettings>) => {
        state.settings = action.payload
        state.mqttClientState = "connecting"
      },
    ),
    connected: create.reducer(state => {
      state.mqttClientState = "connected"
    }),
    disconnect: create.reducer(state => {
      state.mqttClientState = "disconnecting"
    }),
    disconnected: create.reducer(state => {
      state.settings = undefined
      state.mqttClientState = "disconnected"
    }),
    protocolError: create.reducer((state, action: PayloadAction<string>) => {
      state.mqttError = action.payload
    }),
    clearProtocolError: create.reducer(state => {
      state.mqttError = undefined
    }),
    newChat: create.reducer(
      (state, action: PayloadAction<[string, string]>) => {
        const chatId = chatIdFromMessage(action.payload)
        state.chats[chatId] = {
          participants: action.payload,
          messages: [],
        }
      },
    ),
    chatMessageReceived: create.reducer(
      (state, action: PayloadAction<Message>) => {
        const chatId = chatIdFromMessage([
          action.payload.receiver,
          action.payload.sender,
        ])

        const existingChat = state.chats[chatId]
        if (existingChat === undefined) {
          state.chats[chatId] = {
            messages: [action.payload],
            participants: [action.payload.sender, action.payload.receiver],
          }
        } else if (
          !state.settings?.deduplicateMessages ||
          existingChat.messages.find(
            message => message.messageId === action.payload.messageId,
          ) === undefined
        ) {
          existingChat.messages.push(action.payload)
        } else {
          console.log(`Message ${action.payload.messageId} already received`)
        }
      },
    ),
    statusMessageReceived: create.reducer(
      (state, action: PayloadAction<StatusMessage>) => {
        state.chatUserStates[action.payload.userId] = action.payload
      },
    ),
  }),
  selectors: {
    mqttClientReady: mqttChat => mqttChat.mqttClientState === "connected",
    mqttClientState: mqttChat => mqttChat.mqttClientState,
    allChatMessages: mqttChat => mqttChat.chats,
    allChatUserStates: mqttChat => mqttChat.chatUserStates,
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

export const chatUserState = createSelector(
  [mqttChatSlice.selectors.allChatUserStates, (state, chatId) => chatId],
  (chatUserStates, chatId) => chatUserStates[chatId],
)

export const chatParticipants = createSelector(
  [mqttChatSlice.selectors.allChatMessages, (state, chatId) => chatId],
  (chatMessages, chatId) => chatMessages[chatId].participants || [],
)

export const mqttSubscribe = createAction<string>(
  `${mqttChatSlice.name}/subscribeTopic`,
)

export const mqttPublish = createAction<{ topic: string; payload: string }>(
  `${mqttChatSlice.name}/publish`,
)

export const publishOnlineStatus = createAction<{
  status: "online" | "offline"
}>(`${mqttChatSlice.name}/updateStatus`)

export const mqttMessageReceived =
  (topic: string, payload: string): AppThunk =>
  dispatch => {
    const messageTopicMatch = Array.from(
      topic.matchAll(
        /^chat\/messages\/(?<receivingUser>.+)\/(?<sendingUser>.+)$/gm,
      ),
    )[0]

    if (messageTopicMatch) {
      const { sendingUser, receivingUser } = messageTopicMatch.groups!
      console.log(topic, sendingUser, receivingUser, messageTopicMatch)
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

    const statusTopicMatch = topic.match(/^chat\/status\/(?<sendingUser>.+)$/)
    if (statusTopicMatch) {
      const wireMessage = wireStatusMessageSchema.parse(JSON.parse(payload))
      const message: StatusMessage = {
        userId: statusTopicMatch.groups!.sendingUser,
        status: wireMessage.status,
        lastOnlineTimestamp: wireMessage.lastOnlineTimestamp,
      }
      dispatch(statusMessageReceived(message))
    }
  }

export const subscribeChatMessages = (): AppThunk => (dispatch, getState) => {
  const user = mqttUsername(getState())
  if (!user) {
    throw new Error("Not connected")
  }

  if (user === "admin") {
    dispatch(mqttSubscribe(`chat/messages/+/+`))
  } else {
    dispatch(mqttSubscribe(`chat/messages/${user}/+`))
  }
}

export const sendChatMessage =
  (message: WireMessage, to: string): AppThunk =>
  (dispatch, getState) => {
    const user = mqttUsername(getState())
    if (!user) {
      throw new Error("Not connected")
    }
    wireMessageSchema.parse(message)

    const fullMessage: Message = { ...message, sender: user, receiver: to }
    dispatch(mqttChatSlice.actions.chatMessageReceived(fullMessage))

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
  disconnect,
  disconnected,
  chatMessageReceived,
  statusMessageReceived,
  newChat,
  protocolError,
  clearProtocolError,
} = mqttChatSlice.actions

export const {
  mqttClientReady,
  mqttClientState,
  allChatMessages,
  mqttProtocolError,
  allChatUserStates,
} = mqttChatSlice.selectors
