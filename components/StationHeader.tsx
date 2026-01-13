import { ChevronLeft } from 'lucide-react';
import RouteBadge from './RouteBadge';
import Link from 'next/link';

interface Route {
    id: string;
    color: string;
}

interface StationHeaderProps {
    name: string;
    routes?: Route[];
}

export default function StationHeader({ name, routes = [] }: StationHeaderProps) {
    return (
        <header className="p-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-4xl font-medium tracking-tighter flex">
                    <Link href="/" className="mt-1 mr-1 text-neutral-400 hover:text-white">
                        <ChevronLeft className="w-8 h-8 -ml-4" />
                    </Link>
                    <span>{name}</span>
                </h1>
                {routes.length > 0 && (
                    <div className="flex items-center gap-2">
                        {routes.map((route) => (
                            <RouteBadge
                                key={route.id}
                                routeId={route.id}
                                color={route.color}
                            />
                        ))}
                    </div>
                )}
            </div>
        </header>
    );
}
