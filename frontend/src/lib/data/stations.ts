export interface Station {
  id:       string;
  name:     string;
  location: string;
  lat:      number;
  lng:      number;
  status:   "online" | "offline" | "tracking";
  hardware: string;
  wsUrl:    string;
}

export const STATIONS: Station[] = [
  {
    id:       "test",
    name:     "Test Station",
    location: "Sofia, Bulgaria",
    lat:      42.698,
    lng:      23.322,
    status:   "online",
    hardware: "Nd:YAG 532nm · 10Hz",
    wsUrl:    "ws://localhost:3000/ws",
  },
  {
    id:       "station-alpha",
    name:     "Station Alpha",
    location: "Graz, Austria",
    lat:      47.065,
    lng:      15.438,
    status:   "tracking",
    hardware: "Nd:YAG 532nm · 20Hz",
    wsUrl:    "ws://alpha.slr.local:3000/ws",
  },
  {
    id:       "station-beta",
    name:     "Station Beta",
    location: "Matera, Italy",
    lat:      40.649,
    lng:      16.704,
    status:   "offline",
    hardware: "Nd:YAG 532nm · 5Hz",
    wsUrl:    "ws://beta.slr.local:3000/ws",
  },
];

export function getStation(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}