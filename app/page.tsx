import StationSearch from "@/components/StationSearch";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center p-8">
      <h1 className="text-xl font-medium">Search for a station</h1>
      <StationSearch />
      <span className="absolute bottom-8 right-8 tracking-tighter font-semibold">depart.nyc</span>
    </div>
  );
}
