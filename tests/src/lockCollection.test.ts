import { getApiConnection } from "./substrate/substrate-api";
import { expectTxFailure } from "./util/helpers";
import { createCollection, lockCollection, mintNft } from "./util/tx";

describe("Integration test: lock collection", () => {
  const Alice = "//Alice";
  const Bob = "//Bob";
  const Max = 5;

  let api: any;
  before(async () => {
    api = await getApiConnection();
  });

  it("Lock collection", async () => {
    await createCollection(
      api,
      Alice,
      "test-metadata",
      null,
      "test-symbol"
    ).then(async (collectionId) => {
      await lockCollection(api, Alice, collectionId);
    });
  });

  it("[Negative] Lock non-existing NFT collection", async () => {
    const tx = lockCollection(api, Alice, 99999);
    await expectTxFailure(/rmrkCore\.CollectionUnknown/, tx);
  });

  it("[Negative] Lock not an owner NFT collection issuer", async () => {
    await createCollection(
      api,
      Alice,
      "test-metadata",
      null,
      "test-symbol"
    ).then(async (collectionId) => {
      const tx = lockCollection(api, Bob, collectionId);
      await expectTxFailure(/rmrkCore\.NoPermission/, tx);
    });
  });

  it("Lock collection with minting", async () => {
    await createCollection(
      api,
      Alice,
      "test-metadata",
      Max,
      "test-symbol"
    ).then(async (collectionId) => {
      for (let i = 0; i < 5; i++) {
        await mintNft(
          api,
          Alice,
          Alice,
          collectionId,
          "test-metadata",
          null,
          null
        );
      }
      await lockCollection(api, Alice, collectionId, Max);
    });
  });

  it("[Negative] unable to mint NFT inside a locked collection", async () => {
    await createCollection(
      api,
      Alice,
      "test-metadata",
      Max,
      "test-symbol"
    ).then(async (collectionId) => {
      await lockCollection(api, Alice, collectionId);
      const tx = mintNft(
        api,
        Alice,
        Alice,
        collectionId,
        "test-metadata",
        null,
        null
      );
      await expectTxFailure(/rmrkCore\.CollectionFullOrLocked/, tx);
    });
  });

  it("[Negative] unable to mint NFT inside a full collection", async () => {
    await createCollection(api, Alice, "test-metadata", 1, "test-symbol").then(
      async (collectionId) => {
        await mintNft(
          api,
          Alice,
          Alice,
          collectionId,
          "test-metadata",
          null,
          null
        );
        const tx = mintNft(
          api,
          Alice,
          Alice,
          collectionId,
          "test-metadata",
          null,
          null
        );
        await expectTxFailure(/rmrkCore\.CollectionFullOrLocked/, tx);
      }
    );
  });

  after(() => {
    api.disconnect();
  });
});
