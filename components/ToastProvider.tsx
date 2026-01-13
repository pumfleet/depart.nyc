'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            toastOptions={{
                style: {
                    background: '#171717',
                    color: '#fff',
                    border: '1px solid #404040',
                },
            }}
        />
    );
}
