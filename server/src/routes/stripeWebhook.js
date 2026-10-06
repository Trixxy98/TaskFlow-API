const {handleStripeWebhook} =  require("../services/stripeService");

module.exports = async (req, res) => {
    try {
        const signature = req.headers["stripe-signature"];
        if (!signature) {
            return res.status(400).json({success: false, message: "Missing Stripe signature."});
        }

        const result = await handleStripeWebhook(req.body, signature);
        res.json(result);
    } catch (err) {
        const status = err.statusCode || 400;
        console.error("Stripe webhook error:", err.message);
        res.status(status).json({success: false, message: err.message});
    }
};