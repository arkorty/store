import "dotenv/config";
import fetch from "node-fetch";
import slugify from "slugify";
import Stripe from "stripe";

// Load env vars (ensure .env is present at project root)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_CURRENCY = process.env.STRIPE_CURRENCY || "usd";

if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY in env");

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-06-30.basil" });

const FAKE_STORE_API = "https://fakestoreapi.com/products";

async function main() {
	const res = await fetch(FAKE_STORE_API);
	const products = (await res.json()) as any[];

	for (const product of products) {
		// Use the same slugify options as Python
		const slug = slugify(product.title, { lower: true });
		// Use the product's actual price from the API
		const priceAmount = Math.round(parseFloat(product.price) * 100);

		// Check if product with this slug already exists (idempotency)
		const existing = await stripe.products.search({
			query: `active:'true' AND metadata[\"slug\"]:\"${slug}\"`,
		});
		let stripeProduct: Stripe.Product | undefined;
		if (existing.data.length > 0) {
			console.log(`Product '${slug}' already exists, skipping creation.`);
			stripeProduct = existing.data[0];
		} else {
			stripeProduct = await stripe.products.create({
				name: product.title,
				description: product.description,
				images: [product.image],
				metadata: {
					category: product.category,
					slug,
				},
			});
		}

		if (!stripeProduct) continue; // Type safety: should never happen

		// Create price for the product
		const price = await stripe.prices.create({
			product: stripeProduct.id,
			unit_amount: priceAmount, // price in cents
			currency: STRIPE_CURRENCY,
		});

		// Update the product with default_price
		await stripe.products.update(stripeProduct.id, { default_price: price.id });
		console.log(`Set default price for product: ${stripeProduct.name} (${slug})`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

// Print output of Commerce.productBrowse
import * as Commerce from "commerce-kit";

(async () => {
	const products = await Commerce.productBrowse({ first: 100 });
	console.log("\n--- Commerce.productBrowse({ first: 100 }) output ---\n");
	for (const p of products) {
		console.log({
			id: p.id,
			name: p.name,
			slug: p.metadata.slug,
			price: p.default_price.unit_amount,
			currency: p.default_price.currency,
			active: p.active,
		});
	}
})();
