/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_login_api_auth_login_post } from '../models/Body_login_api_auth_login_post';
import type { Body_refresh_token_api_auth_refresh_post } from '../models/Body_refresh_token_api_auth_refresh_post';
import type { UserCreate } from '../models/UserCreate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Register User
     * Register a new user
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static registerUserApiAuthRegisterPost(
        requestBody: UserCreate,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Login
     * Login user with username/email and password
     * @param formData
     * @returns any Successful Response
     * @throws ApiError
     */
    public static loginApiAuthLoginPost(
        formData: Body_login_api_auth_login_post,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Refresh Token
     * Refresh access token using refresh token
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static refreshTokenApiAuthRefreshPost(
        requestBody: Body_refresh_token_api_auth_refresh_post,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
