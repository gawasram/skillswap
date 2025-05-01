/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SessionsService {
    /**
     * Get All Sessions
     * Get all sessions (filtered by user role)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getAllSessionsApiSessionsGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sessions/',
        });
    }
    /**
     * Create Session
     * Create a new session
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createSessionApiSessionsPost(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sessions/',
        });
    }
    /**
     * Get Session
     * Get a specific session
     * @param sessionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSessionApiSessionsSessionIdGet(
        sessionId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sessions/{session_id}',
            path: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Session
     * Update a session
     * @param sessionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateSessionApiSessionsSessionIdPut(
        sessionId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/sessions/{session_id}',
            path: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Start Session
     * Start a session (mentor only)
     * @param sessionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static startSessionApiSessionsSessionIdStartPost(
        sessionId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sessions/{session_id}/start',
            path: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * End Session
     * End a session (mentor only)
     * @param sessionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static endSessionApiSessionsSessionIdEndPost(
        sessionId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sessions/{session_id}/end',
            path: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
