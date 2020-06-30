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

    setSyncToken(token: string | null): void {
        this.db.set('syncToken', token).write();
    }

    getSyncToken(): string | null {
        return this.db.get('syncToken').value();
    }

    setFilter(filter: IFilterInfo): void {
        this.db.set('filter', filter).write();
    }

    getFilter(): IFilterInfo {
        return this.db.get('filter').value();
    }

    addRegisteredUser(userId: string) {
        const key = sha512(userId, "utf8", "hex");
        this.db
            .set(`appserviceUsers.${key}.userId`, userId)
            .set(`appserviceUsers.${key}.registered`, true)
            .write();
    }

    isUserRegistered(userId: string): boolean {
        const key = sha512(userId, "utf8", "hex");
        return this.db.get(`appserviceUsers.${key}.registered`).value();
    }

    isTransactionCompleted(transactionId: string): boolean {
        if (this.trackTransactionsInMemory) {
            return this.completedTransactions.indexOf(transactionId) !== -1;
        }

        const key = sha512(transactionId, "utf8", "hex");
        return this.db.get(`appserviceTransactions.${key}.completed`).value();
    }

    setTransactionCompleted(transactionId: string) {
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
        this.db
            .set(`appserviceTransactions.${key}.txnId`, transactionId)
            .set(`appserviceTransactions.${key}.completed`, true)
            .write();
    }

    readValue(key: string): string | null | undefined {
        return this.db.get("kvStore").value()[key];
    }

    storeValue(key: string, value: string): void {
        const kvStore = this.db.get("kvStore").value();
        kvStore[key] = value;
        this.db.set("kvStore", kvStore).write();
    }
}
