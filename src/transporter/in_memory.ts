import { ITransporter, ITransportPacket, TransportReceiveCallback } from '.'

export class InMemoryTransporter implements ITransporter {
  public readonly type: string = 'InMemory'
  private receivers: { [key: string]: TransportReceiveCallback }
  private receiverDelay: { [key: string]: number }

  constructor() {
    this.receivers = {}
    this.receiverDelay = {}
  }

  send(packet: ITransportPacket) {
    // first we need to query the packet and see which client it's coming from
    const clientId = packet.sourceId
    const clients_to_send_to = Object.keys(this.receivers).filter(x => x != clientId)
    clients_to_send_to.forEach(id => {
      this.receivers[id](packet)
    })
    console.error('Sending to clients: ' + clients_to_send_to, packet)
  }

  setReceive(fn: TransportReceiveCallback, clientId: string) {
    this.receivers[clientId] = fn
    this.receiverDelay[clientId] = 0
  }
  clearReceive(clientId: string) {
    delete this.receivers[clientId]
    delete this.receiverDelay[clientId]
  }
}
