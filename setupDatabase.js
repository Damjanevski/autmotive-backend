// backend/setupDatabase.js
const { Client } = require('pg');
const fs = require('fs');
const csvParser = require('csv-parser');
const path = require('path');

const client = new Client({
    connectionString: 'postgresql://postgres:eATmvhDxwashiWYaGVyqFIrVLiqxgSyn@roundhouse.proxy.rlwy.net:51264/railway', // Use your DATABASE_URL here
});

// SQL query to create the automobiles table
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS automobiles (
    id SERIAL PRIMARY KEY,
    make VARCHAR(50),
    model VARCHAR(50),
    year INT,
    vin VARCHAR(50)
  );
`;

async function setupDatabase() {
    try {
        // Connect to the PostgreSQL client
        await client.connect();
        console.log('Connected to the database successfully.');

        // Create the automobiles table
        await client.query(createTableQuery);
        console.log('Table created successfully or already exists.');

        // Read and parse the CSV file
        const csvData = [];
        const filePath = path.join(__dirname, 'Automobile_data.csv');

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                csvData.push(row);
            })
            .on('end', async () => {
                // Insert data from CSV file into the automobiles table
                for (const row of csvData) {
                    const insertQuery = 'INSERT INTO automobiles (make, model, year, vin) VALUES ($1, $2, $3, $4)';
                    await client.query(insertQuery, [row.make, row.model, row.year, row.vin]);
                }
                console.log('CSV data successfully imported');
                client.end();
            });
    } catch (error) {
        console.error('Error setting up database:', error);
        client.end();
    }
}

// Execute the setupDatabase function
setupDatabase();
