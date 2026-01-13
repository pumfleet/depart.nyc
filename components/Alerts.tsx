import { Alert } from '@/lib/types';
import { getLineColor } from '@/lib/colors';
import RouteBadge from './RouteBadge';

interface AlertsProps {
    alerts: Alert[];
}

function parseAlertText(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /\[([A-Z0-9]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        const routeId = match[1];
        parts.push(
            <RouteBadge
                key={`${match.index}-${routeId}`}
                routeId={routeId}
                color={getLineColor(routeId)}
                size="xs"
            />
        );
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
}

export default function Alerts({ alerts }: AlertsProps) {
    if (alerts.length === 0) return null;

    return (
        <div className="p-4 pt-0 space-y-4">
            {alerts.map((alert) => (
                <div key={alert.id} className="border-l-4 border-orange-500 p-4">
                    <div className="flex items-start space-x-3">
                        <div className="flex-1">
                            <h3 className="text-sm font-light text-white inline-flex items-center gap-1 flex-wrap">
                                {parseAlertText(alert.header.find(h => h.language === 'en')?.text || 'Service Alert')}
                            </h3>
                            <div className="mt-1 text-xs font-light text-neutral-400 inline-flex items-center gap-1 flex-wrap">
                                {parseAlertText(alert.description.find(d => d.language === 'en')?.text || '')}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
