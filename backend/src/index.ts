import { Elysia } from 'elysia'

import mqtt from 'mqtt'

import { mockMessages } from './mockMQTT'


const BROKER_URL = 'mqtt://localhost:1883'


const app = new Elysia()

  .use(mockMessages) 

  .onStart(() => {

    const client = mqtt.connect(BROKER_URL)


    client.on('connect', () => {

      console.log('Connected to MQTT broker')

      client.subscribe('test/+', (err) => {

        if (!err) console.log('Subscribed to test topics')

      })

    })


    client.on('message', (topic, message) => {

      console.log(`Received [${topic}]:`, message.toString())

    })


    client.on("error", (err) => console.error("MQTT Error:", err))

  })

  .get('/', () => 'Server is active')

  .listen(3000)


console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
