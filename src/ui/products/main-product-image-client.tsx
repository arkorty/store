"use client";

import Flmngr from "@flmngr/flmngr-react";
import Image from "next/image";
import type { ComponentPropsWithRef } from "react";
import { useRef, useState } from "react";

function Spinner() {
	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(255,255,255,0.6)",
				zIndex: 9999,
			}}
		>
			<div
				style={{
					width: 48,
					height: 48,
					border: "6px solid #ccc",
					borderTop: "6px solid #333",
					borderRadius: "50%",
					animation: "spin 1s linear infinite",
				}}
			/>
			<style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
		</div>
	);
}

type MainProductImageClientProps = Omit<ComponentPropsWithRef<typeof Image>, "width" | "height" | "sizes">;

const getProxiedUrl = (src: string) => {
	if (typeof src === "string" && src.startsWith("https://files.stripe.com/")) {
		return `/api/proxy-image?url=${encodeURIComponent(src)}`;
	}
	return src;
};

const MainProductImageClient = (props: MainProductImageClientProps) => {
	const imageRef = useRef<HTMLDivElement>(null);
	const [imageSrc, setImageSrc] = useState(props.src);
	const [loading, setLoading] = useState(false);

	const FLMNGR_API_KEY = process.env.NEXT_PUBLIC_FLMNGR_API_KEY;

	const handleEdit = () => {
		setLoading(true);
		const editSrc = getProxiedUrl(imageSrc as string);
		Flmngr.edit({
			apiKey: FLMNGR_API_KEY || "FLMN24RR1234123412341234", // fallback to demo key
			urlFileManager: "https://fm.flmngr.com/fileManager", // demo server
			urlFiles: "https://fm.flmngr.com/files", // demo file storage
			url: editSrc,
			onSave: (
				onExport: (
					name: string,
					format: string,
					quality: number,
					cb: (image: string | Blob) => void,
					errCb: () => void,
				) => void,
				onClose: () => void,
			) => {
				onExport(
					"edited-image",
					"jpg",
					90,
					async (image: string | Blob) => {
						try {
							let imageBlob: Blob;
							let imageUrl: string;
							if (typeof image === "string") {
								// Always convert to Blob, even if it's a data URL or base64
								const res = await fetch(image);
								imageBlob = await res.blob();
								imageUrl = image;
							} else {
								imageBlob = image;
								imageUrl = URL.createObjectURL(imageBlob);
							}
							// Validate image type and size
							const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"];
							if (!allowedTypes.includes(imageBlob.type)) {
								alert("Invalid image type. Only JPG, PNG, GIF, and WEBP are allowed.");
								setLoading(false);
								onClose();
								return;
							}
							if (imageBlob.size > 10 * 1024 * 1024) {
								// 10MB
								alert("Image is too large. Maximum size is 10MB.");
								setLoading(false);
								onClose();
								return;
							}
							// Just update the UI with the new image, do not upload
							setImageSrc(imageUrl);
							setLoading(false);
							onClose();
						} catch (err) {
							console.error(err);
							setLoading(false);
							onClose();
						}
					},
					() => {
						setLoading(false);
						onClose();
					},
				);
			},
		});
	};

	return (
		<>
			{loading && <Spinner />}
			<div ref={imageRef} className={props.className} style={{ position: "relative" }}>
				<Image
					width={700}
					height={700}
					sizes="(max-width: 1024x) 100vw, (max-width: 1280px) 50vw, 700px"
					{...props}
					src={imageSrc}
					className={props.className}
				/>
				<button
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						handleEdit();
					}}
					style={{
						position: "absolute",
						top: 12,
						right: 12,
						background: "rgba(0,0,0,0.6)",
						color: "#fff",
						border: "none",
						borderRadius: 4,
						padding: "6px 12px",
						cursor: "pointer",
						zIndex: 10,
					}}
				>
					EDIT
				</button>
			</div>
		</>
	);
};

export default MainProductImageClient;
