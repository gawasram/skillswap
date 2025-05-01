/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Get All Users
     * Get all users (admin only)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getAllUsersApiUsersGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/',
        });
    }
    /**
     * Get User
     * Get user by ID (own user or admin)
     * @param userId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getUserApiUsersUserIdGet(
        userId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{user_id}',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update User
     * Update user by ID (own user or admin)
     * @param userId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateUserApiUsersUserIdPut(
        userId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/{user_id}',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete User
     * Delete user by ID (admin only)
     * @param userId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteUserApiUsersUserIdDelete(
        userId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/{user_id}',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
