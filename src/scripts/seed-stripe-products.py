import os
import requests
import stripe
from slugify import slugify

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
if not STRIPE_SECRET_KEY:
    raise RuntimeError("Missing STRIPE_SECRET_KEY in env")

stripe.api_key = STRIPE_SECRET_KEY
FAKE_STORE_API = "https://fakestoreapi.com/products"


def main():
    res = requests.get(FAKE_STORE_API)
    res.raise_for_status()
    products = res.json()

    for product in products:
        slug = slugify(product["title"], lowercase=True)
        # Check if product with this slug already exists (idempotency)
        existing = stripe.Product.search(
            query=f"active:'true' AND metadata['slug']:'{slug}'"
        )
        if existing.data:
            print(f"Product '{slug}' already exists, skipping creation.")
            stripe_product = existing.data[0]
        else:
            stripe_product = stripe.Product.create(
                name=product["title"],
                description=product["description"],
                images=[product["image"]],
                metadata={
                    "category": product["category"],
                    "slug": slug,
                },
            )
        # Create a price for the product
        price = stripe.Price.create(
            product=stripe_product.id,
            unit_amount=int(float(product.get("price", 0)) * 100),  # price in cents
            currency="usd",
        )
        # Make a POST request to update the product with default_price
        update_url = f"https://api.stripe.com/v1/products/{stripe_product.id}"
        headers = {
            "Authorization": f"Bearer {STRIPE_SECRET_KEY}",
        }
        data = {
            "default_price": price.id
        }
        response = requests.post(update_url, headers=headers, data=data)
        response.raise_for_status()
        print(f"Set default price for product: {stripe_product['name']} ({slug})")


if __name__ == "__main__":
    main() 
