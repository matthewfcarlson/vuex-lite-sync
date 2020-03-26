import { ITransporter, ITransportPacket, TransportReceiveCallback } from '.'

export class SocketIoTransporter implements ITransporter {
  public readonly type: string = 'SocketIo'

  constructor() {}

  send(packet: ITransportPacket) {}

  setReceive(fn: TransportReceiveCallback, clientId: string) {}
  clearReceive(clientId: string) {}

  close() {}
}
