import { IStorageProvider } from "./IStorageProvider.ts";
import { IFilterInfo } from "../IFilter.ts";
import { IAppserviceStorageProvider } from "./IAppserviceStorageProvider.ts";

/**
 * A storage provider that persists no information by keeping it all in memory.
 * @category Storage providers
 */
export class MemoryStorageProvider implements IStorageProvider, IAppserviceStorageProvider {
    private syncToken: string|null = null;
    private filter: IFilterInfo|null = null;
    private appserviceUsers: { [userId: string]: { registered: boolean } } = {};
    private appserviceTransactions: { [txnId: string]: boolean } = {};
    private kvStore: { [key: string]: string } = {};

    setSyncToken(token: string | null): void {
        this.syncToken = token;
    }

    getSyncToken(): string | null {
        return this.syncToken;
    }

    setFilter(filter: IFilterInfo): void {
        this.filter = filter;
    }

    getFilter(): IFilterInfo|null {
        return this.filter;
    }

    addRegisteredUser(userId: string) {
        this.appserviceUsers[userId] = {
            registered: true,
        };
    }

    isUserRegistered(userId: string): boolean {
        return this.appserviceUsers[userId] && this.appserviceUsers[userId].registered;
    }

    isTransactionCompleted(transactionId: string): boolean {
        return !!this.appserviceTransactions[transactionId];
    }

    setTransactionCompleted(transactionId: string) {
        this.appserviceTransactions[transactionId] = true;
    }

    readValue(key: string): string | null | undefined {
        return this.kvStore[key];
    }

    storeValue(key: string, value: string): void {
        this.kvStore[key] = value;
    }
}
