import { buffer } from "micro";
import * as admin from "firebase-admin";

// Secure only 1 connection to Firebase from the backend
const serviceAccount = require("../../../permissions.json");
const app = !admin.apps.length
  ? admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  : admin.app();

console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
// Establish connection to Stripe

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_SIGNING_SECRET;

const fulfillOrder = async (session) => {
  console.log("\n\nFulfilling order\n\n", session);

  return app
    .firestore()
    .collection("users")
    .doc(session.metadata.email)
    .collection("orders")
    .doc(session.id)
    .set({
      amount: session.amount_total / 100,
      amount_shipping: session.total_details.amount_shipping / 100,
      images: JSON.parse(session.metadata.images),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
    .then(() =>
      console.log(`Success : Order ${session.id} had been added to the DB}`)
    )
    .catch((err) => console.log(err));
};

export default async (req, res) => {
  console.log("\n\n\n\naaaaaaa\n\n\n\n");
  if (req.method === "POST") {
    const requestBuffer = await buffer(req);
    const payload = requestBuffer.toString();
    const sig = req.headers["stripe-signature"];

    let event;

    // Verify that the event posted came from stripe and is legit
    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
      console.log("\n\nEvent\n\n", event);
    } catch (err) {
      console.log("Error", err.message);
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      console.log("\n\ncheckout.session.completed\n\n");
      const session = event.data.object;

      // Fulfil order (put inside database)

      return fulfillOrder(session)
        .then(() => res.status(200))
        .catch((err) => res.status(400).send(`Webhook error ${err.message}`));
    }
  }
};

// app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));

export const config = {
  // Because of the webhook we want the request like a stream
  api: {
    bodyParser: false,
    externalResolver: true, // Not being resolved by me, it will be stripe in this case
  },
};
