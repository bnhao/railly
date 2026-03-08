import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Save JSON data in the "data" folder at the project root
const filePath = path.join(process.cwd(), 'data', 'weatherData.json');

export async function POST(request: Request) {
    try {
        const data = await request.json();

        console.log('Received data:', JSON.stringify(data, null, 2));

        // Ensure the "data" directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Write JSON to file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

        return NextResponse.json({ message: 'Data saved successfully.' });
    } catch (error) {
        console.error('Error in API route:', error);
        return NextResponse.json({ error: 'Error saving data.' }, { status: 500 });
    }
}

export async function GET() {
    try {
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(fileData);
            return NextResponse.json(jsonData);
        } else {
            return NextResponse.json({});
        }
    } catch (error) {
        console.error('Error reading file:', error);
        return NextResponse.json({ error: 'Error reading data.' }, { status: 500 });
    }
}
