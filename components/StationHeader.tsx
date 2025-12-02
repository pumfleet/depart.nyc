import RouteBadge from './RouteBadge';

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
                <h1 className="text-4xl font-medium tracking-tighter">{name}</h1>
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
