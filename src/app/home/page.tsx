import HomeScreen from "@/components/HomeScreen";
import { getProducts, getCategories } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const products = getProducts();
  const categories = getCategories();

  return (
    <HomeScreen
      products={products}
      categories={categories}
    />
  );
}
