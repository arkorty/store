import * as Commerce from "commerce-kit";
import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-06-30.basil" });

export async function POST(req: NextRequest) {
	try {
		// Parse form data
		const formData = await req.formData();
		const slug = formData.get("slug") as string;
		const file = formData.get("image") as File;

		if (!slug || !file) {
			return NextResponse.json({ error: "Missing slug or image" }, { status: 400 });
		}

		// 1. Find product by slug
		const products = await Commerce.productBrowse({ first: 100 });
		const product = products.find((p: any) => p.metadata?.slug === slug);
		if (!product) {
			return NextResponse.json({ error: "Product not found" }, { status: 404 });
		}
		const productId = product.id;

		// 2. Upload image to Stripe
		const buffer = Buffer.from(await file.arrayBuffer());
		const stripeFile = await stripe.files.create({
			purpose: "business_logo",
			file: {
				data: buffer,
				name: file.name,
				type: file.type,
			},
		});

		// 3. Create a file link to get the image URL
		const fileLink = await stripe.fileLinks.create({ file: stripeFile.id });
		const imageUrl = fileLink.url;
		if (!imageUrl) {
			return NextResponse.json({ error: "Failed to get image URL" }, { status: 500 });
		}

		// 4. Update product images
		const updatedProduct = await stripe.products.update(productId, {
			images: [imageUrl],
		});

		return NextResponse.json({ success: true, product: updatedProduct });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
