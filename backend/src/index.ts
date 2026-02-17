import { Elysia } from "elysia"
import { mockMessages } from "./test/mockMQTT"
import { mqttClient } from "./mqttClient"

const BROKER_URL: string = "mqtt://localhost:1883"

const app = new Elysia()
  .use(mockMessages)
  .use(mqttClient({brokerUrl: BROKER_URL}))  
  .get("/", () => "Server is active")
  .listen(3000)

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
