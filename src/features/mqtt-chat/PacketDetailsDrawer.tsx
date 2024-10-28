import type { FC } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import { PacketDetails } from "@/features/mqtt-chat/PacketDetails"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import type { RawMqttPacket } from "@/features/mqtt-chat/messageTypes"

interface ComponentProps {
  open: boolean
  onClose: () => void
  packetData: RawMqttPacket
}

export const PacketDetailsDrawer: FC<ComponentProps> = ({
  packetData,
  open,
  onClose,
}) => {
  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="max-h-[80vh]">
        <div className="flex flex-col w-full items-center overflow-y-scroll">
          <div className="max-w-xl mx-2 px-2 w-full">
            <DrawerHeader>
              <DrawerTitle>
                Packet{" "}
                <span className="font-mono">{packetData.packet.cmd}</span>
              </DrawerTitle>
            </DrawerHeader>
            <Separator />

            <PacketDetails packet={packetData} />

            <Accordion
              type={"single"}
              collapsible={true}
              className="w-full h-1/3 overflow-auto"
            >
              <AccordionItem value={"details"}>
                <AccordionTrigger>Expand details</AccordionTrigger>
                <AccordionContent className="bg-gray-100 p-4">
                  <p className="font-mono whitespace-pre ">
                    {JSON.stringify(packetData.packet, null, 2)}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <DrawerFooter>
              <Button variant={"outline"} onClick={onClose}>
                Close
              </Button>
            </DrawerFooter>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
