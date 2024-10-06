import type { APIGatewayEvent, Context as LambdaContext } from 'aws-lambda';
import type { GraphQLResolveInfo } from 'graphql';
import type { PubSubEngine } from 'graphql-subscriptions';
import type { APIGatewayWebSocketEvent } from './aws';
import type { IConnection, IConnectionManager } from './connections';
import type { ISubscriptionManager } from './subscriptions';
import type { OperationRequest } from './operations';

/**
 * Superset of context passed to every operation invoked by websocket
 */
export interface IContext {
  event: APIGatewayEvent | APIGatewayWebSocketEvent;
  /**
   * Lambda's context can be an empty object in case if custom event processors
   */
  lambdaContext: LambdaContext;
  $$internal: {
    /**
     * Current connection that invoked execution
     *
     * This is set up only during websocket event processing:
     *  - event processing
     *  - $connect
     *  - $disconnect
     *  - $default
     *
     * Ignored for HTTP event handling
     */
    connection?: IConnection;

    connectionManager: IConnectionManager;

    /**
     * Current executed operation
     *
     * This is set up only during websocket $default and event processing
     */
    operation?: OperationRequest;

    /**
     * Pub sub is set up only during event processing and websocket event processing
     *
     * Ignored for HTTP event handling
     */
    pubSub?: PubSubEngine;

    /**
     * Should we register subscriptions?
     * Basically this means that PubSub will call subscriptionManager
     * Otherwise it will create an async iterator right away
     *
     * For internal use only
     */
    registerSubscriptions?: boolean;
    subscriptionManager: ISubscriptionManager;
  };

  [key: string]: any;
}

export type SubcribeResolveFn = (
  rootValue: any,
  args: any,
  context: IContext,
  info?: GraphQLResolveInfo,
) => Promise<AsyncIterator<any> & AsyncIterable<any>>;
