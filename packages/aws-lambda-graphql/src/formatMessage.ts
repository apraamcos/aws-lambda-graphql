import type {
  GQLOperation,
  GQLConnectionACK,
  GQLErrorEvent,
  GQLNext,
  GQLComplete,
  GQLStopOperation,
  GQLConnectionInit
} from "./protocol";

type AllowedProtocolEvents =
  | GQLOperation
  | GQLConnectionACK
  | GQLErrorEvent
  | GQLNext
  | GQLComplete
  | GQLConnectionInit
  | GQLStopOperation;

export function formatMessage(event: AllowedProtocolEvents): string {
  return JSON.stringify(event);
}
