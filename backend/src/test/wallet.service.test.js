import { beforeEach, describe, expect, it, vi } from "vitest";

const walletModelMock = {
  getOrCreate: vi.fn(),
  listTransactions: vi.fn(),
  listOrderTransactions: vi.fn(),
};

vi.mock("../models/wallet.model.js", () => ({
  walletModel: walletModelMock,
}));

const { getWallet } = await import("../services/wallet.service.js");

describe("wallet.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows seller sale transactions using product amount only", async () => {
    walletModelMock.getOrCreate.mockResolvedValue({
      userId: "seller-1",
      available: 1200,
      pending: 300,
    });
    walletModelMock.listTransactions.mockResolvedValue([]);
    walletModelMock.listOrderTransactions.mockResolvedValue([
      {
        id: "order-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
        amount: 1000,
        shippingCost: 200,
        buyerProtectionFee: 50,
        orderDate: "2026-04-27T10:00:00.000Z",
        product: { title: "Product A" },
      },
    ]);

    const wallet = await getWallet("seller-1");

    expect(wallet.transactions).toHaveLength(1);
    expect(wallet.transactions[0]).toMatchObject({
      id: "sale:order-1",
      type: "sale",
      amount: 1000,
      productTitle: "Product A",
    });
  });

  it("shows buyer purchase transactions including shipping and protection fees", async () => {
    walletModelMock.getOrCreate.mockResolvedValue({
      userId: "buyer-1",
      available: 500,
      pending: 0,
    });
    walletModelMock.listTransactions.mockResolvedValue([]);
    walletModelMock.listOrderTransactions.mockResolvedValue([
      {
        id: "order-2",
        buyerId: "buyer-1",
        sellerId: "seller-2",
        amount: 1000,
        shippingCost: 200,
        buyerProtectionFee: 50,
        orderDate: "2026-04-27T11:00:00.000Z",
        product: { title: "Product B" },
      },
    ]);

    const wallet = await getWallet("buyer-1");

    expect(wallet.transactions).toHaveLength(1);
    expect(wallet.transactions[0]).toMatchObject({
      id: "purchase:order-2",
      type: "purchase",
      amount: 1250,
      productTitle: "Product B",
    });
  });
});
