import type { DocumentNode, ExecutionResult } from "graphql";

export enum CLIENT_EVENT_TYPES {
  GQL_SUBSCRIBE = "subscribe",
  GQL_COMPLETE = "complete",
  GQL_CONNECTION_INIT = "connection_init",
  GQL_DISCONNECT = "disconnect"
}

export enum SERVER_EVENT_TYPES {
  GQL_CONNECTION_ACK = "connection_ack",
  GQL_ERROR = "error",
  GQL_NEXT = "next",
  GQL_COMPLETE = "complete"
}

/**
 * Client -> Server
 *
 * Starts an operation (query, mutation, subscription)
 *
 * https://github.com/apollographql/subscriptions-transport-ws/blob/master/src/client.ts#L324
 */
export interface GQLOperation {
  id: string;
  payload: {
    query: string | DocumentNode;
    variables?: { [key: string]: any };
    extensions?: { [key: string]: any };
  };
  type: CLIENT_EVENT_TYPES.GQL_SUBSCRIBE;
}

export function isGQLOperation(event: any): event is GQLOperation {
  return event && typeof event === "object" && event.type === CLIENT_EVENT_TYPES.GQL_SUBSCRIBE;
}

/**
 * Client -> Server
 *
 * Stops subscription
 */
export interface GQLStopOperation {
  id: string;
  type: CLIENT_EVENT_TYPES.GQL_COMPLETE;
}

export function isGQLStopOperation(event: any): event is GQLStopOperation {
  return event && typeof event === "object" && event.type === CLIENT_EVENT_TYPES.GQL_COMPLETE;
}

/**
 * Client -> Server
 */
export interface GQLConnectionInit {
  payload?: { [key: string]: any };
  type: CLIENT_EVENT_TYPES.GQL_CONNECTION_INIT;
}

export function isGQLConnectionInit(event: any): event is GQLConnectionInit {
  return (
    event && typeof event === "object" && event.type === CLIENT_EVENT_TYPES.GQL_CONNECTION_INIT
  );
}

/**
 * Client -> Server
 */
export interface GQLDisconnect {
  // id is not sent
  // see https://github.com/apollographql/subscriptions-transport-ws/blob/master/src/client.ts#L170
  payload?: {
    [key: string]: any;
  };
  type: CLIENT_EVENT_TYPES.GQL_DISCONNECT;
}

export function isGQLDisconnect(event: any): event is GQLDisconnect {
  return event && typeof event === "object" && event.type === CLIENT_EVENT_TYPES.GQL_DISCONNECT;
}

/**
 * Server -> Client
 *
 * Subscription is done
 */
export interface GQLComplete {
  /** The ID of GQLOperation used to subscribe */
  id: string;
  type: SERVER_EVENT_TYPES.GQL_COMPLETE;
}

/**
 *  Server -> Client as response to GQLConnectionInit
 */
export interface GQLConnectionACK {
  id?: string;
  payload?: {
    [key: string]: any;
  };
  type: SERVER_EVENT_TYPES.GQL_CONNECTION_ACK;
}

/**
 * Server -> Client as response to operation or just generic error
 */
export interface GQLErrorEvent {
  id?: string;
  payload: {
    message: string;
  };
  type: SERVER_EVENT_TYPES.GQL_ERROR;
}

/**
 * Server -> Client - response to operation
 */
export interface GQLNext {
  id: string;
  payload: ExecutionResult;
  type: SERVER_EVENT_TYPES.GQL_NEXT;
}

export type GQLClientAllEvents =
  | GQLOperation
  | GQLStopOperation
  | GQLConnectionInit
  | GQLStopOperation;

export type GQLServerAllEvents = GQLComplete | GQLConnectionACK | GQLErrorEvent | GQLNext;
