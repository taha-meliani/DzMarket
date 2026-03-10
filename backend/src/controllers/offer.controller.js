import { createOffer, getMyAcceptedOffer, respondToOffer } from "../services/offer.service.js";

export async function createOfferController(req, res, next) {
  try {
    const offer = await createOffer(req.user.userId, req.validated.body);
    return res.status(201).json(offer);
  } catch (error) {
    return next(error);
  }
}

export async function respondOfferController(req, res, next) {
  try {
    const offer = await respondToOffer(req.validated.params.id, req.user.userId, req.validated.body);
    return res.json(offer);
  } catch (error) {
    return next(error);
  }
}

export async function getMyAcceptedOfferController(req, res, next) {
  try {
    const offer = await getMyAcceptedOffer(
      req.user.userId,
      req.validated.params.productId,
      req.validated.query.selectedOption,
      req.validated.query.quantity,
    );
    return res.json(offer);
  } catch (error) {
    return next(error);
  }
}
