import type { mqttClient } from "./plugins/mqtt"
import type { influx } from "./plugins/influx"

type MqttPlugin   = ReturnType<typeof mqttClient>
type InfluxPlugin = ReturnType<typeof influx>

export type MqttDecorator   = MqttPlugin["decorator"]["mqtt"]
export type InfluxDecorator = InfluxPlugin["decorator"]["influx"]
