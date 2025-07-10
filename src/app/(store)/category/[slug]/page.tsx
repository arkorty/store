import * as Commerce from "commerce-kit";
import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { deslugify } from "@/lib/utils";
import { ProductList } from "@/ui/products/product-list";

export const generateMetadata = async (props: { params: Promise<{ slug: string }> }): Promise<Metadata> => {
	const params = await props.params;
	const decodedSlug = decodeURIComponent(params.slug);
	const products = await Commerce.productBrowse({
		first: 100,
		filter: { category: decodedSlug },
	});

	if (products.length === 0) {
		return notFound();
	}

	const t = await getTranslations("/category.metadata");

	return {
		title: t("title", { categoryName: deslugify(decodedSlug) }),
		alternates: { canonical: `${publicUrl}/category/${params.slug}` },
	};
};

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
	const params = await props.params;
	const decodedSlug = decodeURIComponent(params.slug);

	const products = await Commerce.productBrowse({
		first: 100,
		filter: { category: decodedSlug },
	});

	if (products.length === 0) {
		return notFound();
	}

	const t = await getTranslations("/category.page");

	return (
		<main className="pb-8">
			<h1 className="text-3xl font-bold leading-none tracking-tight text-foreground">
				{deslugify(decodedSlug)}
				<div className="text-lg font-semibold text-muted-foreground">
					{t("title", { categoryName: deslugify(decodedSlug) })}
				</div>
			</h1>
			<ProductList products={products} />
		</main>
	);
}
