'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            gutter={0}
            containerStyle={{
                top: 0,
                left: 0,
                right: 0,
                margin: 0,
                padding: 0,
                inset: 0,
            }}
            toastOptions={{
                style: {
                    background: '#171717',
                    color: '#fff',
                    border: '2px solid #404040',
                    maxWidth: '100%',
                    width: '100%',
                    margin: 0,
                    padding: 0,
                    borderRadius: 0,
                },
            }}
        />
    );
}
