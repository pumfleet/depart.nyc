import { NextRequest, NextResponse } from 'next/server';

const TRANSITER_BASE_URL = process.env.TRANSITER_URL ?? 'http://localhost:8080';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const pathString = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${TRANSITER_BASE_URL}/${pathString}${searchParams ? `?${searchParams}` : ''}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error proxying to Transiter:', error);
        return NextResponse.json(
            { error: 'Failed to fetch from Transiter API' },
            { status: 500 }
        );
    }
}
