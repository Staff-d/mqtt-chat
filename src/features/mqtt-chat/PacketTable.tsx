import type { ColumnDef } from "@tanstack/react-table"
import type { RawMqttPacket } from "@/features/mqtt-chat/messageTypes"
import type { FC } from "react"
import { useCallback, useMemo, useState } from "react"
import { useAppSelector } from "@/app/hooks"
import { DataTable } from "@/components/ui/data-table"
import { DateTime } from "luxon"
import { ChevronsLeft, ChevronsRight, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { PacketDetailsDrawer } from "@/features/mqtt-chat/PacketDetailsDrawer"

type RawMqttPacketWithIndex = RawMqttPacket & { index: number }

const columnsBuilder: (
  onPacketSelected: (messageId: string) => void,
) => ColumnDef<RawMqttPacketWithIndex>[] = onPacketSelected => [
  {
    header: "Idx",
    id: "rowIndex",
    cell: ({ row }) => {
      return <span>{row.original.index + 1}</span>
    },
  },
  {
    header: "Direction",
    accessorKey: "direction",
    cell: ({ row }) => {
      const { direction } = row.original
      if (direction === "inbound") {
        return (
          <div className="flex flex-col justify-center">
            <ChevronsRight />
            <span className="text-xs">INBOUND</span>
          </div>
        )
      } else {
        return (
          <div className="flex flex-col justify-center">
            <ChevronsLeft />
            <span className="text-xs">OUTBOUND</span>
          </div>
        )
      }
    },
  },
  {
    header: "Received At",
    accessorFn: ({ receivedAt }) =>
      DateTime.fromISO(receivedAt).toFormat("HH:mm:ss.SSS"),
  },
  {
    header: "Packet",
    cell: ({
      row: {
        original: { packet },
      },
    }) => {
      return <span className="font-mono">{packet.cmd}</span>
    },
  },
  {
    header: "Topic",
    cell: ({
      row: {
        original: { packet },
      },
    }) => {
      if (packet.cmd === "publish") {
        return packet.topic
      } else if (packet.cmd === "subscribe") {
        return packet.subscriptions[0].topic
      }
      return <span className="text-gray-500">n/a</span>
    },
  },
  {
    header: "",
    id: "details",
    cell: ({ row }) => {
      const messageId = `${row.original.receptionId}`
      return (
        <Button
          size={"icon"}
          variant={"outline"}
          onClick={() => onPacketSelected(messageId)}
        >
          <FileText />
        </Button>
      )
    },
  },
]

export const PacketTable: FC = () => {
  const [detailDrawerSubject, setDetailDrawerSubject] = useState<string>("")
  // for a normal component we could control the display state via the
  // selectedPacketData only, but since the drawer plays a little
  // animation when it closes this would cut the animation short
  const [detailDrawerOpen, setDetailDrawerOpen] = useState<boolean>(false)
  const [showPings, setShowPings] = useState<boolean>(true)
  const [showPacketDirection, setShowPacketDirection] = useState<
    "all" | "inbound" | "outbound"
  >("all")
  const packetData = useAppSelector(state => state.mqttChat.mqttPackets)

  const filteredPacketData = useMemo<RawMqttPacketWithIndex[]>(() => {
    let ret = packetData.map((packet, index) => ({ ...packet, index }))
    if (!showPings) {
      ret = ret.filter(
        packet => !["pingreq", "pingresp"].includes(packet.packet.cmd),
      )
    }

    if (showPacketDirection !== "all") {
      ret = ret.filter(packet => packet.direction === showPacketDirection)
    }

    return ret
  }, [packetData, showPings, showPacketDirection])

  const onPacketSelected = useCallback(
    (messageId: string) => {
      setDetailDrawerSubject(messageId)
    },
    [setDetailDrawerSubject],
  )

  const columnDefinition = useMemo(
    () =>
      columnsBuilder(messageId => {
        onPacketSelected(messageId)
        setDetailDrawerOpen(true)
      }),
    [onPacketSelected],
  )

  const selectedPacketData = useMemo(
    () =>
      packetData.find(
        packet => `${packet.receptionId}` === detailDrawerSubject,
      ),
    [packetData, detailDrawerSubject],
  )

  return (
    <div className={"flex flex-col w-full items-center"}>
      <Card className="flex flex-col w-full max-w-7xl">
        <div className="flex items-center justify-center space-x-2 p-2">
          <Checkbox
            id="show-pings"
            checked={showPings}
            onCheckedChange={checked => setShowPings(!!checked)}
          />
          <Label
            htmlFor="show-pings"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show Pings
          </Label>
          <Separator orientation={"vertical"} decorative={false} />
          <RadioGroup
            defaultValue="all"
            orientation={"horizontal"}
            onValueChange={value =>
              setShowPacketDirection(value as "all" | "inbound" | "outbound")
            }
            // grid-flow-col has to be added to the class manually to make the
            // horizontal layout work
            // https://github.com/shadcn-ui/ui/issues/1632#issuecomment-1761354358
            className="grid-flow-col"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="r1" />
              <Label htmlFor="r1">Show All Packets</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inbound" id="r2" />
              <Label htmlFor="r2">Inbound Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outbound" id="r3" />
              <Label htmlFor="r3">Outbound only</Label>
            </div>
          </RadioGroup>
        </div>
        <DataTable columns={columnDefinition} data={filteredPacketData} />
      </Card>
      {selectedPacketData && (
        <PacketDetailsDrawer
          open={detailDrawerOpen}
          onClose={() => setDetailDrawerOpen(false)}
          packetData={selectedPacketData}
        />
      )}
    </div>
  )
}
