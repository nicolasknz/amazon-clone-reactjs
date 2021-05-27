module.exports = {
  images: {
    domains: ["links.papareact.com", "fakestoreapi.com"],
  },

  // Dont put private details in here because it will be exposed

  env: {
    stripe_public_key: process.env.STRIPE_PUBLIC_KEY,
  },
};
