import assert from "assert";
import { ConnectionNotFoundError } from "./errors";
import type {
  IConnection,
  IConnectEvent,
  IConnectionManager,
  ISubscriptionManager,
  IConnectionData,
  HydrateConnectionOptions
} from "./types";
import { prefixRedisKey } from "./helpers";
import {
  ApiGatewayManagementApiClient,
  DeleteConnectionCommand,
  PostToConnectionCommand
} from "@aws-sdk/client-apigatewaymanagementapi";
import { getRedisClient } from "./helpers/redis";

interface RedisConnectionManagerOptions {
  /**
   * Use this to override ApiGatewayManagementApi (for example in usage with serverless-offline)
   *
   * If not provided it will be created with endpoint from connections
   */
  apiGatewayManager?: ApiGatewayManagementApiClient;
  /**
   * IORedis client instance
   */
  redisClientHost: string;
  subscriptions: ISubscriptionManager;
}

/**
 * RedisConnectionManager
 *
 * Stores connections in Redis store
 */
export class RedisConnectionManager implements IConnectionManager {
  private apiGatewayManager: ApiGatewayManagementApiClient | undefined;

  private redisClientHost: string;

  private subscriptions: ISubscriptionManager;

  constructor({
    apiGatewayManager,
    redisClientHost,
    subscriptions
  }: RedisConnectionManagerOptions) {
    assert.ok(
      typeof subscriptions === "object",
      "Please provide subscriptions to manage subscriptions."
    );
    assert.ok(
      redisClientHost == null || typeof redisClientHost === "string",
      "Please provide redisClient as an instance of ioredis.Redis"
    );
    assert.ok(
      apiGatewayManager == null || typeof apiGatewayManager === "object",
      "Please provide apiGatewayManager as an instance of ApiGatewayManagementApi"
    );

    this.apiGatewayManager = apiGatewayManager;
    this.redisClientHost = redisClientHost;
    this.subscriptions = subscriptions;
  }

  hydrateConnection = async (
    connectionId: string,
    options: HydrateConnectionOptions
  ): Promise<IConnection> => {
    const redisClient = await getRedisClient(this.redisClientHost);
    const { retryCount = 0, timeout = 50 } = options || {};
    // if connection is not found, throw so we can terminate connection
    let connection;

    for (let i = 0; i <= retryCount; i++) {
      const key = prefixRedisKey(`connection:${connectionId}`);
      const result = await redisClient.get(key);
      if (result) {
        // Jump out of loop
        connection = JSON.parse(result) as IConnection;
        break;
      }
      // wait for another round
      await new Promise(r => setTimeout(r, timeout));
    }

    if (!connection) {
      throw new ConnectionNotFoundError(`Connection ${connectionId} not found`);
    }

    return connection as IConnection;
  };

  setConnectionData = async (data: IConnectionData, connection: IConnection): Promise<void> => {
    const redisClient = await getRedisClient(this.redisClientHost);
    await redisClient.set(
      prefixRedisKey(`connection:${connection.id}`),
      JSON.stringify({
        ...connection,
        data
      }),
      "EX",
      7200 // two hours maximal ttl for apigateway websocket connections
    );
  };

  registerConnection = async ({ connectionId, endpoint }: IConnectEvent): Promise<IConnection> => {
    const redisClient = await getRedisClient(this.redisClientHost);
    const connection: IConnection = {
      id: connectionId,
      data: { endpoint, context: {}, isInitialized: false }
    };

    await redisClient.set(
      prefixRedisKey(`connection:${connectionId}`),
      JSON.stringify({
        createdAt: new Date().toString(),
        id: connection.id,
        data: connection.data
      }),
      "EX",
      7200 // two hours maximal ttl for apigateway websocket connections
    );
    return connection;
  };

  sendToConnection = async (connection: IConnection, payload: string | Buffer): Promise<void> => {
    try {
      await this.createApiGatewayManager(connection.data.endpoint).send(
        new PostToConnectionCommand({
          ConnectionId: connection.id,
          Data: payload
        })
      );
    } catch (e) {
      // this is stale connection
      // remove it from store
      if (e.$metadata?.httpStatusCode === 410) {
        await this.unregisterConnection(connection);
      } else {
        throw e;
      }
    }
  };

  unregisterConnection = async ({ id }: IConnection): Promise<void> => {
    const redisClient = await getRedisClient(this.redisClientHost);
    const key = prefixRedisKey(`connection:${id}`);
    await Promise.all([redisClient.del(key), this.subscriptions.unsubscribeAllByConnectionId(id)]);
  };

  closeConnection = async ({ id, data }: IConnection): Promise<void> => {
    await this.createApiGatewayManager(data.endpoint).send(
      new DeleteConnectionCommand({
        ConnectionId: id
      })
    );
  };

  /**
   * Creates api gateway manager
   *
   * If custom api gateway manager is provided, uses it instead
   */
  private createApiGatewayManager(endpoint: string): ApiGatewayManagementApiClient {
    if (this.apiGatewayManager) {
      return this.apiGatewayManager;
    }

    if (!/^https?:\/\//i.test(endpoint)) {
      endpoint = `https://${endpoint}`;
    }

    this.apiGatewayManager = new ApiGatewayManagementApiClient({ endpoint });

    return this.apiGatewayManager;
  }
}
