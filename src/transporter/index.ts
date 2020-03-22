export type TransportReceiveCallback = (packet: ITransportPacket) => void

export interface ITransporter {
  readonly type: string
  send: (fn: ITransportPacket) => void
  setReceive: (fn: TransportReceiveCallback, clientId: string) => void
}

export interface ITransportPacket {
  readonly action: string
  readonly payload: any
  readonly sourceId: string // The ID of the client that sent it
  readonly msSinceLastPacket: number
  readonly packetId: number // this is the id of the packet, hashed with the previous packet
  readonly previousPacketId: number // this is the previous packet that the store received
}
