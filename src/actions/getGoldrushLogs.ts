"use server";

import { GoldRushClient, type LogEvent } from "@covalenthq/client-sdk";
import { FLEXOR_ADDRESS } from "@/lib/utils";

export async function getGoldrushLogs(
  startingBlock: "earliest" | number,
  endingBlock: "latest" | number
): Promise<LogEvent[]> {
  const client = new GoldRushClient(process.env.GOLDRUSH_KEY!);

  const resp = client.BaseService.getLogEventsByTopicHash(
    "999",
    "0x0e6e00de66a4c2595a6f8f4596bc7f70679268479919ff9123026868a4327fbc",
    { startingBlock, endingBlock }
  );

  const logs: LogEvent[] = [];
  for await (const value of resp) {
    value.data?.items?.forEach((e) => {
      if (e.sender_address === FLEXOR_ADDRESS.toLowerCase()) {
        logs.push(e);
      }
    });
  }

  return logs;
}
