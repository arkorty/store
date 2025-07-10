import JewelleryImage from "@/images/accessories.jpg"; // Reuse accessories image for jewellery for now
import MenImage from "@/images/apparel.jpg";

export const config = {
	categories: [
		{ name: "Men", slug: "Men's Clothing", image: MenImage },
		{ name: "Jewellery", slug: "jewelery", image: JewelleryImage },
	],

	social: {
		x: "https://x.com/yourstore",
		facebook: "https://facebook.com/yourstore",
	},

	contact: {
		email: "support@yourstore.com",
		phone: "+1 (555) 111-4567",
		address: "123 Store Street, City, Country",
	},
};

export type StoreConfig = typeof config;
export default config;
