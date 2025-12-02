import { Alert } from '@/lib/types';

interface AlertsProps {
    alerts: Alert[];
}

export default function Alerts({ alerts }: AlertsProps) {
    if (alerts.length === 0) return null;

    return (
        <div className="p-4 pt-0 space-y-4">
            {alerts.map((alert) => (
                <div key={alert.id} className="border-l-4 border-orange-500 p-4">
                    <div className="flex items-start space-x-3">
                        <div className="flex-1">
                            <h3 className="text-sm font-light text-white">
                                {alert.header.find(h => h.language === 'en')?.text || 'Service Alert'}
                            </h3>
                            <div className="mt-1 text-xs font-light text-neutral-400">
                                {alert.description.find(d => d.language === 'en')?.text}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
