import StationSearch from "@/components/StationSearch";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">depart.nyc</h1>
      <StationSearch />
    </div>
  );
}
