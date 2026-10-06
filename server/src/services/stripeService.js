const Stripe = require("stripe");
const {
    setPlan,
    getBillingIds,
    findUserIdByStripeCustomer,
    findUserIdByStripeSubscription,
} = require("./subscriptionService");

const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        const err = new Error("Stripe is not configured.");
        err.statusCode = 503;
        err.code = "STRIPE_NOT_CONFIRGURED";
        throw err;
    }
    return new Stripe(key);
};

const isStripeConfigured = () => 
    Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);

const appOrigin = () => 
(process.env.ALLOWED_ORIGIN || "http://localhost:5173").split(",")[0].trim();

const createCheckoutSession = async (user) => {
    if (!isStripeConfigured()) {
        const err = new Error("Paid checkout is not configured yet.");
        err.statusCode = 503;
        err.code = "STRIPE_NOT_CONFIGURED";
        throw err;
    }

    const stripe = getStripe();
    const {stripeCustomerId} = await getBillingIds(user.id);
    const origin = appOrigin();

    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{price: process.env.STRIPE_PRICE_ID, quantity: 1}],
        success_url: `${origin}/pricing?checkout=success`,
        cancel_url: `${origin}/pricing?checkout=cancel`,
        client_reference_id: String(user.id),
        customer: stripeCustomerId || undefined,
        customer_email: stripeCustomerId ? undefined : user.email,
        metadata: {userId: String(user.id)},
        subscription_data: {
            metadata: {userId: String(user.id)},
        },
    });

    return {url: session.url};
};

const createPortalSession = async (userId) => {
    const stripe = getStripe();
    const {stripeCustomerId} = await getBillingIds(userId);
    if (!stripeCustomerId) {
        const err = new Error("No stripe customer on this account yet.");
        err.statusCode = 400;
        throw err;
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${appOrigin()}/pricing`,
    });

    return {url: session.url};
};

const activateFromCheckoutSession = async (session) => {
    const userId = Number(session.client_reference_id || session.metadata?.userId);
    if (!userId) return;

    await setPlan(userId, "pro", {
        stripeCustomerId: session.customer || null,
        stripeSubscriptionId: session.subscription || null,
    });
};

const syncSubscription = async (subscription) => {
    const userId = 
     Number(subscription.metadata?.userId) ||
     (await findUserIdByStripeSubscription(subscription.id)) ||
     (await findUserIdByStripeCustomer(subscription.customer));

     if (!userId) return;

     const active = ["active", "trialing"].includes(subscription.status);
     if (active) {
        await setPlan(userId, "pro", {
            stripeCustomerId: subscription.customer || null,
            stripeSubscriptionId: subscription.id,
        });
        return;
     }

     await setPlan(userId, "free", {
        stripeSubscriptionId: null,
     });
};

const handleStripeWebhook = async (rawBody, signature) => {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
        const err = new Error("Stripe webhook secret is not configured.");
        err.statusCode = 503;
        throw err;
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
        err.statusCode = 400;
        err.message = `Webhook signature verification failed: ${err.message}`;
        throw err;
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            if (session.mode === "subscription" && session.status === "complete") {
                await activateFromCheckoutSession(session);
            }
            break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
            await syncSubscription(event.data.object);
            break;
        }
        default:
            break;
    }

    return {received: true};
};

module.exports = {
    isStripeConfigured,
    createCheckoutSession,
    createPortalSession,
    handleStripeWebhook,
};