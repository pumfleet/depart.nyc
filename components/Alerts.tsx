import { Alert } from '@/lib/types';

interface AlertsProps {
    alerts: Alert[];
}

export default function Alerts({ alerts }: AlertsProps) {
    if (alerts.length === 0) return null;

    return (
        <div className="p-4 space-y-4">
            {alerts.map((alert) => (
                <div key={alert.id} className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 text-white">
                    <div className="flex items-start space-x-3">
                        <div className="shrink-0 mt-0.5">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-red-200">
                                {alert.header.find(h => h.language === 'en')?.text || 'Service Alert'}
                            </h3>
                            <div className="mt-1 text-sm text-red-300">
                                {alert.description.find(d => d.language === 'en')?.text}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
