const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
          const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
              return res.status(400).json({ error: 'No items provided' });
      }

      const lineItems = items.map(item => ({
              price_data: {
                        currency: 'usd',
                        product_data: {
                                    name: item.title || item.name || 'Product',
                                    description: item.size ? `Size: ${item.size}` : undefined,
                                    tax_code: 'txcd_99999999',
                        },
                        unit_amount: Math.round((item.price || 0) * 100),
                        tax_behavior: 'exclusive',
              },
              quantity: item.quantity || 1,
      }));

      const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              line_items: lineItems,
              mode: 'payment',
              automatic_tax: { enabled: true },
              billing_address_collection: 'required',
              shipping_address_collection: {
                        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'FI', 'JP'],
              },
              success_url: `${req.headers.origin || 'https://www.velenblanks.com'}/?success=true`,
              cancel_url: `${req.headers.origin || 'https://www.velenblanks.com'}/?canceled=true`,
      });

      res.status(200).json({ url: session.url });
    } catch (error) {
          console.error('Stripe error:', error.message);
          res.status(500).json({ error: error.message });
    }
};
