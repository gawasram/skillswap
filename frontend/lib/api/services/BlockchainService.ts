/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BlockchainService {
    /**
     * Get Events By Contract
     * Get events by contract name
     * @param contractName
     * @param page
     * @param limit
     * @param eventName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getEventsByContractApiBlockchainEventsContractNameGet(
        contractName: string,
        page: number = 1,
        limit: number = 20,
        eventName?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/blockchain/events/{contract_name}',
            path: {
                'contract_name': contractName,
            },
            query: {
                'page': page,
                'limit': limit,
                'event_name': eventName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Event By Tx Hash
     * Get event by transaction hash
     * @param txHash
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getEventByTxHashApiBlockchainEventsTxTxHashGet(
        txHash: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/blockchain/events/tx/{tx_hash}',
            path: {
                'tx_hash': txHash,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Events By Address
     * Get events for a specific address (as participant)
     * @param address
     * @param page
     * @param limit
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getEventsByAddressApiBlockchainEventsAddressAddressGet(
        address: string,
        page: number = 1,
        limit: number = 20,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/blockchain/events/address/{address}',
            path: {
                'address': address,
            },
            query: {
                'page': page,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Tokens
     * Get token info
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getTokensApiBlockchainTokensGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/blockchain/tokens',
        });
    }
    /**
     * Get Blockchain Mentors
     * Get blockchain mentor list
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getBlockchainMentorsApiBlockchainMentorsGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/blockchain/mentors',
        });
    }
    /**
     * Create Blockchain Transaction
     * Create a blockchain transaction
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createBlockchainTransactionApiBlockchainTransactionsPost(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/blockchain/transactions',
        });
    }
}
