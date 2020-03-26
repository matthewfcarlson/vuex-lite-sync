import { ITransporter, ITransportPacket, TransportReceiveCallback } from '.'
import { boundMethod } from 'autobind-decorator'
import { boundClass } from 'autobind-decorator'

interface InMemoryReceiverOptions {
  delay?: number
}
type transportMap = { [key: string]: InMemoryTransporter }

@boundClass
export class InMemoryTransporter implements ITransporter {
  public readonly type: string = 'SocketIo'
  public readonly delay: number

  private static rooms?: { [key: string]: transportMap }
  private static transports?: transportMap
  private receiver?: TransportReceiveCallback
  private clientId?: string

  constructor(options?: InMemoryReceiverOptions) {
    this.delay = options?.delay || 0
    if (InMemoryTransporter.rooms == undefined) InMemoryTransporter.rooms = {}
    if (InMemoryTransporter.transports == undefined) InMemoryTransporter.transports = {}
  }

  public static init() {
    InMemoryTransporter.rooms = {}
    InMemoryTransporter.transports = {}
  }

  public send(packet: ITransportPacket) {
    // first we need to query the packet and see which client it's coming from
    if (this.clientId == undefined || InMemoryTransporter.transports == undefined) {
      console.error('UNABLE TO SEND')
      return // TODO assert
    }
    const clientId = packet.sourceId
    if (clientId != this.clientId) {
      console.error(clientId, this.clientId)
      return
    }
    // first we find the clients we want to send to
    // we need to go through the list of all the rooms we are in?
    const clients_to_send_to = Object.keys(InMemoryTransporter.transports).filter(
      x => x != clientId
    )
    // this function gets the transports and does get packet on each with a possible delay?
    this.wait_fn(() => {
      clients_to_send_to
        .map(x => (InMemoryTransporter.transports ? InMemoryTransporter.transports[x] : null))
        .forEach(x => x?.get_packet(packet))
    })
  }

  // A packet has come from another transport
  private get_packet(packet: ITransportPacket) {
    const callback = this.receiver
    if (callback) {
      const callback_primed = () => callback(packet)
      this.wait_fn(callback_primed)
    } else {
      console.error('Dropping the packet')
    }
  }

  private wait_fn(fn: () => void) {
    if (this.delay == 0) fn()
    else this.wait().then(fn)
  }

  private async wait() {
    const delay = this.delay
    return new Promise(resolve => {
      setTimeout(resolve, delay)
    })
  }

  setReceive(fn: TransportReceiveCallback, clientId: string) {
    if (this.clientId) {
      console.error("You can't have more than one receiver on the transport")
      this.clearReceive()
    }
    this.receiver = fn
    this.clientId = clientId
    InMemoryTransporter.transports![this.clientId] = this
  }
  clearReceive() {
    if (this.clientId && InMemoryTransporter.transports) {
      delete InMemoryTransporter.transports[this.clientId]
      if (InMemoryTransporter.transports[this.clientId]) console.error('Failed to delete')
    }
    this.clientId = undefined
  }

  close() {
    this.clearReceive()
  }
}
