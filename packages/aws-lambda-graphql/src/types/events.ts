import type { Handler as LambdaHandler } from 'aws-lambda';
import type { ISubscriptionEvent } from './subscriptions';

export interface IEventStore {
  publish(event: ISubscriptionEvent): Promise<any>;
}

export interface IEventProcessor<
  TServer extends object,
  THandler extends LambdaHandler
> {
  /**
   * Creates Lambda event handler
   */
  createHandler(server: TServer): THandler;
}
