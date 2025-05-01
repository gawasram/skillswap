/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WebhooksService {
    /**
     * Payment Webhook
     * Webhook for payment events
     * @returns any Successful Response
     * @throws ApiError
     */
    public static paymentWebhookApiWebhooksPaymentPost(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/webhooks/payment',
        });
    }
    /**
     * Blockchain Webhook
     * Webhook for blockchain events
     * @returns any Successful Response
     * @throws ApiError
     */
    public static blockchainWebhookApiWebhooksBlockchainPost(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/webhooks/blockchain',
        });
    }
}
