import * as expect from "expect";
import { MentionPill } from "../../src";
import { createTestClient } from "../MatrixClientTest.ts";
import * as simple from "simple-mock";

describe('MentionPill', () => {
    describe('forUser', () => {
        it('should accept static inputs', async () => {
            const userId = "@test:example.org";
            const displayName = "John Doe";
            const expectedHtml = `<a href="https://matrix.to/#/${userId}">${displayName}</a>`;
            const expectedText = displayName;

            const mention = await MentionPill.withDisplayName(userId, displayName);
            expect(mention).toBeDefined();
            expect(mention.html).toBe(expectedHtml);
            expect(mention.text).toBe(expectedText);
        });

        it('should generate a pill for a user', async () => {
            const userId = "@test:example.org";
            const displayName = userId; //"John Doe";
            const expectedHtml = `<a href="https://matrix.to/#/${userId}">${displayName}</a>`;
            const expectedText = displayName;

            const mention = await MentionPill.forUser(userId);
            expect(mention).toBeDefined();
            expect(mention.html).toBe(expectedHtml);
            expect(mention.text).toBe(expectedText);
        });

        it('should generate a pill for a user using their profile', async () => {
            const {client} = createTestClient();

            const userId = "@test:example.org";
            const displayName = "John Doe";
            const expectedHtml = `<a href="https://matrix.to/#/${userId}">${displayName}</a>`;
            const expectedText = displayName;

            const profileSpy = simple.mock(client, "getUserProfile").callFn((uid) => {
                expect(uid).toEqual(userId);
                return {displayname: displayName};
            });
            const stateSpy = simple.mock(client, "getRoomStateEvent").callFn((rid, eventType, stateKey) => {
                throw new Error("Unexpected call");
            });

            const mention = await MentionPill.forUser(userId, null, client);
            expect(mention).toBeDefined();
            expect(mention.html).toBe(expectedHtml);
            expect(mention.text).toBe(expectedText);
            expect(profileSpy.callCount).toBe(1);
            expect(stateSpy.callCount).toBe(0);
        });

        it('should generate a pill for a user using their profile in a room', async () => {
            const {client} = createTestClient();

            const userId = "@test:example.org";
            const roomId = "!somewhere:example.org";
            const displayName = "John Doe";
            const expectedHtml = `<a href="https://matrix.to/#/${userId}">${displayName}</a>`;
            const expectedText = displayName;

            const profileSpy = simple.mock(client, "getUserProfile").callFn((uid) => {
                throw new Error("Unexpected call");
            });
            const stateSpy = simple.mock(client, "getRoomStateEvent").callFn((rid, eventType, stateKey) => {
                expect(rid).toBe(roomId);
                expect(eventType).toBe("m.room.member");
                expect(stateKey).toBe(userId);
                return {displayname: displayName};
            });

            const mention = await MentionPill.forUser(userId, roomId, client);
            expect(mention).toBeDefined();
            expect(mention.html).toBe(expectedHtml);
            expect(mention.text).toBe(expectedText);
            expect(profileSpy.callCount).toBe(0);
            expect(stateSpy.callCount).toBe(1);
        });

        it('should generate use the user ID when the profile errors (profile endpoint)', async () => {
            const {client} = createTestClient();

            const userId = "@test:example.org";
            const roomId = "!somewhere:example.org";
            const displayName = "John Doe";
            const expectedHtml = `<a href="https://matrix.to/#/${userId}">${userId}</a>`;
            const expectedText = userId;

            const profileSpy = simple.mock(client, "getUserProfile").callFn((uid) => {
                throw new Error("Simulated failure 1");
            });
            const stateSpy = simple.mock(client, "getRoomStateEvent").callFn((rid, eventType, stateKey) => {
                throw new Error("Simulated failure 2");
            });

            const mention = await MentionPill.forUser(userId, null, client);
            expect(mention).toBeDefined();
            expect(mention.html).toBe(expectedHtml);
            expect(mention.text).toBe(expectedText);
            expect(profileSpy.callCount).toBe(1);
            expect(stateSpy.callCount).toBe(0);
        });

        it('should generate use the user ID when the profile errors (room endpoint)', async () => {
            const {client} = createTestClient();

            const userId = "@test:example.org";
            const roomId = "!somewhere:example.org";
            const displayName = "John Doe";
            const expectedHtml = `<a href="https://matrix.to/#/${userId}">${userId}</a>`;
            const expectedText = userId;

            const profileSpy = simple.mock(client, "getUserProfile").callFn((uid) => {
                throw new Error("Simulated failure 1");
            });
            const stateSpy = simple.mock(client, "getRoomStateEvent").callFn((rid, eventType, stateKey) => {
                throw new Error("Simulated failure 2");
            });

            const mention = await MentionPill.forUser(userId, roomId, client);
            expect(mention).toBeDefined();
            expect(mention.html).toBe(expectedHtml);
            expect(mention.text).toBe(expectedText);
            expect(profileSpy.callCount).toBe(0);
            expect(stateSpy.callCount).toBe(1);
        });
    });
});
