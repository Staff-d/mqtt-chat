import type { FC } from "react"

interface ComponentProps {
  primary: Record<string, string>
  secondary: Record<string, string>
}

export const KeyValuePairList: FC<ComponentProps> = ({
  primary,
  secondary,
}) => {
  return (
    <div className="w-full h-full flex flex-col">
      <dl className="grid grid-cols-3">
        {Object.entries(primary).map((pair, index) => (
          <div key={index} className="col-span-3 flex justify-between py-2">
            <dt className="font-medium text-muted-foreground">{pair[0]}</dt>
            <dd className="text-right">{pair[1]}</dd>
          </div>
        ))}
      </dl>
      {/*<Separator />*/}
      {/*<div className="flex flex-row">*/}
      {/*  <dl className="grid grid-cols-3 gap-4 grow">*/}
      {/*    {Object.entries(secondary).filter((_,index) => index % 2 === 0).map((pair, index) => (*/}
      {/*      <div key={index} className="col-span-3 flex justify-between py-2 border-b py-1">*/}
      {/*        <dt className="font-medium text-muted-foreground">{pair[0]}</dt>*/}
      {/*        <dd className="text-right">{pair[1]}</dd>*/}
      {/*      </div>*/}
      {/*    ))}*/}
      {/*  </dl>*/}

      {/*  <dl className="grid grid-cols-3 gap-4 grow">*/}
      {/*    {Object.entries(secondary).filter((_,index) => index % 2 === 1).map((pair, index) => (*/}
      {/*      <div key={index} className="col-span-3 flex justify-between py-2 border-b py-1">*/}
      {/*        <dt className="font-medium text-muted-foreground">{pair[0]}</dt>*/}
      {/*        <dd className="text-right">{pair[1]}</dd>*/}
      {/*      </div>*/}
      {/*    ))}*/}
      {/*  </dl>*/}

      {/*</div>*/}
    </div>
  )
}
