import { createDispatcher, TOPICS } from "./services/dispatch.service"
import { writePosition } from "./services/slr.service"
import { InfluxDecorator, MqttDecorator } from "./types"

export function setupMqtt(
  mqtt: MqttDecorator,
  influx: InfluxDecorator,
  publish: (topic: string, payload: string) => void
) {
  mqtt.subscribe([...TOPICS])

  const dispatch = createDispatcher({
    "slr/:stationId/cmd": ({ stationId }, payload) => {
      publish(`slr/${stationId}/cmd`, payload)
    },
    "slr/:stationId/tracking/:objId/pos": ({ stationId, objId }, payload) => {
      publish(`slr/${stationId}/tracking/${objId}/pos`, payload)
      writePosition(influx, stationId, objId, payload).catch(console.error)
    },
    "slr/:stationId/env": ({ stationId }, payload) => {
      publish(`slr/${stationId}/env`, payload)
    },
    "slr/:stationId/system": ({ stationId }, payload) => {
      publish(`slr/${stationId}/system`, payload)
    },
    "slr/:stationId/log/:level": ({ stationId, level }, payload) => {
      publish(`slr/${stationId}/log/${level}`, payload)
    },
  })

  mqtt.onMessage(dispatch)
}