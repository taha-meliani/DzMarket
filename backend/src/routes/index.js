import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import productsRoutes from "./products.routes.js";
import ordersRoutes from "./orders.routes.js";
import walletRoutes from "./wallet.routes.js";
import paymentMethodRoutes from "./payment-method.routes.js";
import favoritesRoutes from "./favorites.routes.js";
import chatRoutes from "./chat.routes.js";
import notificationsRoutes from "./notifications.routes.js";
import offersRoutes from "./offers.routes.js";
import reportsRoutes from "./reports.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/products", productsRoutes);
router.use("/orders", ordersRoutes);
router.use("/wallet", walletRoutes);
router.use("/payment-methods", paymentMethodRoutes);
router.use("/favorites", favoritesRoutes);
router.use("/chat", chatRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/offers", offersRoutes);
router.use("/reports", reportsRoutes);

export default router;
