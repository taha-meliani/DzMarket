import { chatModel } from "../models/chat.model.js";
import { offerModel } from "../models/offer.model.js";
import { productModel } from "../models/product.model.js";
import { AppError } from "../utils/app-error.js";

const RICH_MESSAGE_PREFIX = "dzm:rich:v1:";

const encodeRichMessage = (payload) => `${RICH_MESSAGE_PREFIX}${JSON.stringify(payload)}`;

const makeOfferPayload = ({
  offerId,
  event,
  status,
  productId,
  productTitle,
  selectedOption,
  quantity,
  offeredPrice,
  buyerId,
  sellerId,
}) => ({
  text: "",
  images: [],
  offer: {
    offerId,
    event,
    status,
    productId,
    productTitle,
    selectedOption,
    quantity,
    offeredPrice,
    buyerId,
    sellerId,
  },
});

export async function createOffer(buyerId, payload) {
  const offeredPrice = Number(payload.offeredPrice);
  if (!Number.isFinite(offeredPrice) || offeredPrice <= 0) {
    throw new AppError("Invalid offer price", 400);
  }

  const quantity = Number(payload.quantity) || 1;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new AppError("Invalid quantity", 400);
  }

  const product = await productModel.getById(payload.productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  if (product.sellerId === buyerId) {
    throw new AppError("You cannot make an offer on your own product", 400);
  }

  const productOption = (product.options || []).find((option) => option.name === payload.selectedOption);
  if (!productOption) {
    throw new AppError("Selected option not found", 400);
  }
  if (Number(productOption.quantity) < quantity || Number(product.quantity) < quantity) {
    throw new AppError("Selected quantity is not available", 400);
  }

  const participants = [buyerId, product.sellerId];
  const existingConversation = await chatModel.findDirectConversationByParticipants(participants);
  const conversation = existingConversation || (await chatModel.createConversation("DIRECT", participants));

  const offer = await offerModel.create({
    productId: product.id,
    buyerId,
    sellerId: product.sellerId,
    conversationId: conversation.id,
    selectedOption: payload.selectedOption,
    quantity,
    offeredPrice,
    status: "PENDING",
  });

  await chatModel.createMessage(
    conversation.id,
    buyerId,
    encodeRichMessage(
      makeOfferPayload({
        offerId: offer.id,
        event: "CREATED",
        status: "PENDING",
        productId: product.id,
        productTitle: product.title,
        selectedOption: payload.selectedOption,
        quantity,
        offeredPrice,
        buyerId,
        sellerId: product.sellerId,
      }),
    ),
  );

  return offer;
}

export async function respondToOffer(offerId, actorUserId, payload) {
  const offer = await offerModel.getById(offerId);
  if (!offer) {
    throw new AppError("Offer not found", 404);
  }
  const isParticipant = offer.sellerId === actorUserId || offer.buyerId === actorUserId;
  if (!isParticipant) {
    throw new AppError("Only offer participants can respond", 403);
  }
  if (offer.status !== "PENDING") {
    throw new AppError("Offer is no longer pending", 409);
  }

  if (payload.action === "ACCEPT") {
    const updated = await offerModel.update(offer.id, {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      acceptedPrice: offer.offeredPrice,
    });
    await chatModel.createMessage(
      offer.conversationId,
      actorUserId,
      encodeRichMessage(
        makeOfferPayload({
          offerId: offer.id,
          event: "ACCEPTED",
          status: "ACCEPTED",
          productId: offer.productId,
          productTitle: offer.product?.title || "",
          selectedOption: offer.selectedOption,
          quantity: offer.quantity,
          offeredPrice: Number(updated.acceptedPrice || offer.offeredPrice),
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
        }),
      ),
    );
    return updated;
  }

  if (payload.action === "REJECT") {
    const updated = await offerModel.update(offer.id, {
      status: "REJECTED",
      rejectedAt: new Date(),
    });
    await chatModel.createMessage(
      offer.conversationId,
      actorUserId,
      encodeRichMessage(
        makeOfferPayload({
          offerId: offer.id,
          event: "REJECTED",
          status: "REJECTED",
          productId: offer.productId,
          productTitle: offer.product?.title || "",
          selectedOption: offer.selectedOption,
          quantity: offer.quantity,
          offeredPrice: Number(offer.offeredPrice),
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
        }),
      ),
    );
    return updated;
  }

  if (payload.action === "COUNTER") {
    const counterPrice = Number(payload.counterPrice);
    if (!Number.isFinite(counterPrice) || counterPrice <= 0) {
      throw new AppError("Invalid counter price", 400);
    }

    await offerModel.update(offer.id, {
      status: "REJECTED",
      rejectedAt: new Date(),
    });

    await chatModel.createMessage(
      offer.conversationId,
      actorUserId,
      encodeRichMessage(
        makeOfferPayload({
          offerId: offer.id,
          event: "REJECTED",
          status: "REJECTED",
          productId: offer.productId,
          productTitle: offer.product?.title || "",
          selectedOption: offer.selectedOption,
          quantity: offer.quantity,
          offeredPrice: Number(offer.offeredPrice),
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
        }),
      ),
    );

    const counterOffer = await offerModel.create({
      productId: offer.productId,
      buyerId: offer.buyerId,
      sellerId: offer.sellerId,
      conversationId: offer.conversationId,
      selectedOption: offer.selectedOption,
      quantity: offer.quantity,
      offeredPrice: counterPrice,
      status: "PENDING",
    });

    await chatModel.createMessage(
      offer.conversationId,
      actorUserId,
      encodeRichMessage(
        makeOfferPayload({
          offerId: counterOffer.id,
          event: "COUNTERED",
          status: "PENDING",
          productId: offer.productId,
          productTitle: offer.product?.title || "",
          selectedOption: offer.selectedOption,
          quantity: offer.quantity,
          offeredPrice: counterPrice,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
        }),
      ),
    );

    return counterOffer;
  }

  throw new AppError("Unsupported offer action", 400);
}

export async function getMyAcceptedOffer(userId, productId, selectedOption, quantity) {
  if (!selectedOption || !quantity) return null;
  return offerModel.getMyAcceptedForProduct({
    buyerId: userId,
    productId,
    selectedOption,
    quantity: Number(quantity),
  });
}
