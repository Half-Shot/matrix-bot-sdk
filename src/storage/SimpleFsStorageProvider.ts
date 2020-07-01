import { IStorageProvider } from "./IStorageProvider.ts";
import { IFilterInfo } from "../IFilter.ts";
import { CasualDB } from "https://deno.land/x/casualdb@0.1.1/mod.ts";
import { IAppserviceStorageProvider } from "./IAppserviceStorageProvider.ts";
import { sha512 } from "https://denopkg.com/chiefbiiko/sha512/mod.ts";
/**
 * A storage provider that uses the disk to store information.
 * @category Storage providers
 */
export class SimpleFsStorageProvider implements IStorageProvider, IAppserviceStorageProvider {

    private db: CasualDB<any>;
    private completedTransactions: string[] = [];

    /**
     * Creates a new simple file system storage provider.
     * @param {string} filename The file name (typically 'storage.json') to store data within.
     * @param {boolean} trackTransactionsInMemory True (default) to track all received appservice transactions rather than on disk.
     * @param {int} maxInMemoryTransactions The maximum number of transactions to hold in memory before rotating the oldest out. Defaults to 20.
     */
    constructor(private filename: string, private trackTransactionsInMemory = true, private maxInMemoryTransactions = 20) {
        // mkdirp.sync(path.dirname(filename));
        this.db = new CasualDB<any>();
    }

    async connect() {
        await this.db.connect(this.filename);
        await this.db.seed({
            syncToken: null,
            filter: null,
            appserviceUsers: {}, // userIdHash => { data }
            appserviceTransactions: {}, // txnIdHash => { data }
            kvStore: {}, // key => value (str)
        });
    }

    async setSyncToken(token: string | null) {
        await this.db.write('syncToken', token);
    }

    async getSyncToken(): Promise<string | null> {
        return (await this.db.get<string>('syncToken')).value();
    }

    async setFilter(filter: IFilterInfo) {
        await this.db.write('filter', filter);
    }

    async getFilter(): Promise<IFilterInfo> {
        return (await this.db.get<IFilterInfo>('filter')).value();
    }

    async addRegisteredUser(userId: string) {
        const key = sha512(userId, "utf8", "hex");
        await this.db.write(`appserviceUsers.${key}.userId`, userId);
        await this.db.write(`appserviceUsers.${key}.registered`, true);
    }

    async isUserRegistered(userId: string): Promise<boolean> {
        const key = sha512(userId, "utf8", "hex");
        return (await this.db.get<boolean>(`appserviceUsers.${key}.registered`)).value();
    }

    async isTransactionCompleted(transactionId: string): Promise<boolean> {
        if (this.trackTransactionsInMemory) {
            return this.completedTransactions.indexOf(transactionId) !== -1;
        }

        const key = sha512(transactionId, "utf8", "hex");
        return (await this.db.get<boolean>(`appserviceUsers.${key}.completed`)).value();
    }

    async setTransactionCompleted(transactionId: string) {
        if (this.trackTransactionsInMemory) {
            if (this.completedTransactions.indexOf(transactionId) === -1) {
                this.completedTransactions.push(transactionId);
            }
            if (this.completedTransactions.length > this.maxInMemoryTransactions) {
                this.completedTransactions = this.completedTransactions.reverse().slice(0, this.maxInMemoryTransactions).reverse();
            }
            return;
        }

        const key = sha512(transactionId, "utf8", "hex");
        await this.db.write(`appserviceTransactions.${key}.txnId`, transactionId)
        await this.db.write(`appserviceTransactions.${key}.completed`, true);
    }

    async readValue(key: string): Promise<string | null | undefined> {
        return (await this.db.get<{[key: string]: string | null | undefined}>("kvStore")).value()[key];
    }

    async storeValue(key: string, value: string) {
        const kvStore = (await this.db.get<{[key: string]: string | null | undefined}>("kvStore")).value();
        kvStore[key] = value;
        await this.db.write("kvStore", kvStore);
    }
}
