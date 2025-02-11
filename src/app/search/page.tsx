"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Link from "next/link";

type Product = {
  _id: string;
  name: string;
  category: string;
  price: number;
  tags: [];
  imageUrl?: string;
  description: string;
};

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      const searchQuery = groq`*[_type == "product" && name match $query]{
        _id,
        name,
        category,
        price,
        tags,
        "imageUrl": image.asset->url,
        description
      }`;

      try {
        const results = await client.fetch(searchQuery, { query: `${query}*` });
        setProducts(results);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query]);

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItemIndex = cart.findIndex((item: any) => item._id === product._id);

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (products.length === 0) {
    return <p className="text-slate-50">No products found for "{query}".</p>;
  }

  return (
    <div className="p-6 bg-white">
      <h1>Search Results for "{query}"</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="border p-4 rounded">
            <h2>{product.name}</h2>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-40 object-cover"
              />
            )}
            <p>{product.description}</p>
            <p>Category: {product.category}</p>
            <p>Price: ${product.price}</p>
            <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => addToCart(product)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p>Loading search results...</p>}>
      <SearchResults />
    </Suspense>
  );
}
