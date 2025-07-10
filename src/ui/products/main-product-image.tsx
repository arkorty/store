"use client";
import dynamic from "next/dynamic";
import type Image from "next/image";
import type { ComponentPropsWithRef } from "react";

const MainProductImageClient = dynamic(() => import("./main-product-image-client"), { ssr: false });

export const MainProductImage = (
	props: Omit<ComponentPropsWithRef<typeof Image>, "width" | "height" | "sizes">,
) => {
	return <MainProductImageClient {...props} />;
};
