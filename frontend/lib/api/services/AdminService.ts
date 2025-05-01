/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * Admin Dashboard
     * Admin dashboard overview
     * @returns any Successful Response
     * @throws ApiError
     */
    public static adminDashboardApiAdminDashboardGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/dashboard',
        });
    }
    /**
     * Database Stats
     * Database statistics
     * @returns any Successful Response
     * @throws ApiError
     */
    public static databaseStatsApiAdminDbStatsGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/db/stats',
        });
    }
    /**
     * Slow Queries
     * Analyze slow queries
     * @returns any Successful Response
     * @throws ApiError
     */
    public static slowQueriesApiAdminDbSlowQueriesGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/db/slow-queries',
        });
    }
    /**
     * Create Backup
     * Create a database backup
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createBackupApiAdminDbBackupPost(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/db/backup',
        });
    }
    /**
     * List Backups
     * List available backups
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listBackupsApiAdminDbBackupsGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/db/backups',
        });
    }
    /**
     * Restore Backup
     * Restore database from backup
     * @param backupName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static restoreBackupApiAdminDbRestoreBackupNamePost(
        backupName: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/db/restore/{backup_name}',
            path: {
                'backup_name': backupName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Migrations
     * List migrations
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listMigrationsApiAdminMigrationsGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/migrations',
        });
    }
    /**
     * Run Migrations
     * Run pending migrations
     * @returns any Successful Response
     * @throws ApiError
     */
    public static runMigrationsApiAdminMigrationsRunPost(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/migrations/run',
        });
    }
    /**
     * Rollback Migration
     * Rollback migrations
     * @param count
     * @returns any Successful Response
     * @throws ApiError
     */
    public static rollbackMigrationApiAdminMigrationsRollbackPost(
        count: number = 1,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/migrations/rollback',
            query: {
                'count': count,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
