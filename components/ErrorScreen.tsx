import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorScreenProps {
    message?: string;
}

export default function ErrorScreen({ message = 'Something went wrong' }: ErrorScreenProps) {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-white text-lg mb-6">{message}</p>
            <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
                <RefreshCw className="w-4 h-4" />
                Retry
            </button>
        </div>
    );
}
